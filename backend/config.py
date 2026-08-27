"""
PRAKALP-DRISHTI — runtime configuration.

One place reads the environment, so no module has to guess a default and no
credential is duplicated across the codebase.

The important switch here is LLM_ENABLED. The system's stated posture is
air-gapped sovereign operation, and the deterministic Fact engine is what
delivers that. A cloud LLM is therefore OFF unless a key is explicitly
supplied: absence of configuration must mean the safe mode, never the leaky
one.
"""

from __future__ import annotations

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent


def _load_dotenv() -> None:
    """Populate os.environ from .env without adding a hard dependency.

    python-dotenv is used when present; otherwise a small parser handles the
    KEY=VALUE form this project uses. Existing environment variables always
    win, so a container's real secrets are never overwritten by a stray file.
    """
    env_path = BASE_DIR / ".env"
    if not env_path.exists():
        return
    try:
        from dotenv import load_dotenv
        load_dotenv(env_path, override=False)
        return
    except Exception:
        pass
    for raw in env_path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, _, v = line.partition("=")
        os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))


_load_dotenv()


def _csv(name: str, default: str) -> list[str]:
    return [x.strip() for x in os.getenv(name, default).split(",") if x.strip()]


# ── Network ──────────────────────────────────────────────────────────────
HOST = os.getenv("PRAKALP_HOST", "127.0.0.1")
PORT = int(os.getenv("PRAKALP_PORT", "8000"))

ALLOWED_ORIGINS = _csv(
    "PRAKALP_ALLOWED_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173,"
    "http://localhost:8000,http://127.0.0.1:8000",
)

SECRET_KEY = os.getenv("PRAKALP_SECRET_KEY", "")

# ── Copilot ──────────────────────────────────────────────────────────────
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "").strip()

# llama-3.3-70b-versatile was specified but Groq has retired it: the API now
# answers 404 "model does not exist" for that id. Verified against
# /v1/models with this key -- 14 models are available and none is a llama-3.3.
# The chain below is tried in order so a future retirement degrades to the next
# model instead of silently disabling the copilot.
GROQ_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
GROQ_MODEL_FALLBACKS = [
    m for m in [
        GROQ_MODEL,
        "openai/gpt-oss-120b",
        "qwen/qwen3.8-27b",
        "openai/gpt-oss-20b",
    ] if m
]

GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions"
GROQ_TIMEOUT_S = float(os.getenv("GROQ_TIMEOUT_S", "20"))

# Cloudflare fronts api.groq.com and answers 403 "error code: 1010" to the
# default Python-urllib signature. An explicit, honest User-Agent is required
# for the request to reach Groq at all.
HTTP_USER_AGENT = "prakalp-drishti/1.0 (MoSPI decision-intelligence)"

# The single predicate the rest of the codebase should test. A blank key is a
# deliberate, supported configuration -- not a misconfiguration.
LLM_ENABLED = bool(GROQ_API_KEY)


def posture() -> dict:
    """Machine-readable statement of what this process will and will not do.

    Served on /api/health so the deployment's actual network behaviour can be
    read off the running system instead of taken on trust from a README.
    """
    return {
        "offline_air_gapped_mode": not LLM_ENABLED,
        "outbound_calls_enabled": LLM_ENABLED,
        "outbound_destinations": ["api.groq.com"] if LLM_ENABLED else [],
        "copilot_mode": "llm_phrasing_over_verified_facts" if LLM_ENABLED
                        else "deterministic_fact_retrieval",
        "note": (
            "A cloud LLM is configured. Project data in a copilot question "
            "leaves this network. Clear GROQ_API_KEY to restore fully "
            "air-gapped operation; every other engine is unaffected."
            if LLM_ENABLED else
            "No outbound destinations configured. All answers are assembled "
            "from locally computed, Merkle-signed facts."
        ),
    }
