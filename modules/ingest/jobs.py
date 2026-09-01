"""
PRAKALP-DRISHTI: INGESTION JOB REGISTRY

A single background worker, an in-process job table, and an atomic snapshot swap.

WHY NOT CELERY / REDIS
----------------------
The measured cost of a full corpus rebuild on this data is ~7.4s (KAAL-CHAKRA 5.32s,
SETU-GRAPH 2.05s) over 2,207 projects. A broker, a result backend and a worker fleet buy
nothing at that scale, and each is another network dependency inside a deployment whose
value proposition is that it runs air-gapped. One daemon thread and a lock is the honest
amount of machinery for the problem.

WHAT MUST NOT HAPPEN ON THE REQUEST PATH
----------------------------------------
Validation is synchronous -- an officer submitting a malformed CUF gets 422 with the full
error list immediately, not a job id that fails silently ten seconds later. Only work
that CANNOT fail informatively runs in the background: the write, the corpus rebuild, the
seal.

WHAT IS DELIBERATELY NOT REBUILT
--------------------------------
Ingestion never refits the AFT model or the conformal calibration. Both are versioned
artefacts, and refitting them changes `model_hash`, which invalidates the `model_sha256`
recorded in every Merkle proof already issued. A new project is SCORED against the
existing fitted parameters -- that is what a fitted model is for. Refits stay deliberate,
versioned and human-approved.
"""

from __future__ import annotations

import queue
import threading
import time
import traceback
import uuid
from dataclasses import dataclass, field
from typing import Any, Callable, Dict, List, Optional

MAX_JOBS_RETAINED = 200


@dataclass
class Job:
    job_id: str
    kind: str
    submitted_by: Optional[str]
    state: str = "queued"                  # queued | running | succeeded | failed
    submitted_at: float = field(default_factory=time.time)
    started_at: Optional[float] = None
    finished_at: Optional[float] = None
    detail: Dict[str, Any] = field(default_factory=dict)
    error: Optional[str] = None

    def as_dict(self) -> Dict[str, Any]:
        return {
            "job_id": self.job_id,
            "kind": self.kind,
            "state": self.state,
            "submitted_by": self.submitted_by,
            "submitted_at": self.submitted_at,
            "started_at": self.started_at,
            "finished_at": self.finished_at,
            "duration_s": (round(self.finished_at - self.started_at, 3)
                           if self.started_at and self.finished_at else None),
            "detail": self.detail,
            "error": self.error,
        }


class JobRegistry:
    def __init__(self) -> None:
        self._jobs: Dict[str, Job] = {}
        self._order: List[str] = []
        self._lock = threading.Lock()
        self._queue: "queue.Queue[tuple]" = queue.Queue()
        self._worker: Optional[threading.Thread] = None

    # ── submission ──────────────────────────────────────────────────────────
    def submit(self, kind: str, fn: Callable[[Job], Dict[str, Any]],
               submitted_by: Optional[str] = None) -> Job:
        job = Job(job_id=uuid.uuid4().hex[:16], kind=kind, submitted_by=submitted_by)
        with self._lock:
            self._jobs[job.job_id] = job
            self._order.append(job.job_id)
            while len(self._order) > MAX_JOBS_RETAINED:
                self._jobs.pop(self._order.pop(0), None)
        self._queue.put((job, fn))
        self._ensure_worker()
        return job

    def get(self, job_id: str) -> Optional[Job]:
        return self._jobs.get(job_id)

    def recent(self, limit: int = 20) -> List[Dict[str, Any]]:
        with self._lock:
            ids = list(reversed(self._order[-limit:]))
        return [self._jobs[i].as_dict() for i in ids if i in self._jobs]

    # ── worker ──────────────────────────────────────────────────────────────
    def _ensure_worker(self) -> None:
        if self._worker is None or not self._worker.is_alive():
            # daemon: a pending rebuild must never keep the process alive on shutdown.
            self._worker = threading.Thread(target=self._run, name="prakalp-ingest",
                                            daemon=True)
            self._worker.start()

    def _run(self) -> None:
        while True:
            try:
                job, fn = self._queue.get(timeout=60)
            except queue.Empty:
                return                      # idle: exit; submit() restarts on demand
            job.state = "running"
            job.started_at = time.time()
            try:
                job.detail.update(fn(job) or {})
                job.state = "succeeded"
            except Exception as exc:
                job.state = "failed"
                # Type and message only. A traceback can carry a connection string.
                job.error = f"{type(exc).__name__}: {exc}"
                job.detail.setdefault("traceback_logged", True)
                traceback.print_exc()
            finally:
                job.finished_at = time.time()
                self._queue.task_done()

    def wait(self, job_id: str, timeout: float = 30.0) -> Optional[Job]:
        """Block until a job settles. For tests and CLI use, never for a request."""
        deadline = time.time() + timeout
        while time.time() < deadline:
            job = self.get(job_id)
            if job and job.state in ("succeeded", "failed"):
                return job
            time.sleep(0.02)
        return self.get(job_id)


registry = JobRegistry()
