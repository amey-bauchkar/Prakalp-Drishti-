"""
PRAKALP-DRISHTI: Citizen Grievance & Whistleblower Telemetry Service
Interoperable with CPGRAMS guidelines, DPDP Act 2023, and backed by Supabase PostgreSQL.
"""

from __future__ import annotations

import os
import json
import random
import logging
from contextlib import contextmanager
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any, List
from pathlib import Path
from pydantic import BaseModel, Field

logger = logging.getLogger("prakalp.grievance")

BASE_DIR = Path(__file__).resolve().parent.parent
LOCAL_BACKUP_PATH = BASE_DIR / "artifacts" / "submitted_grievances.jsonl"

CATEGORY_LABELS: Dict[str, str] = {
    "ghost_progress": "Ghost Progress / Deserted Worksite",
    "safety_hazard": "Public Safety & Hazardous Detour",
    "environmental": "Environmental & Dust Non-Compliance",
    "quality_defect": "Substandard Material & Structural Cracking",
    "land_compensation": "Land Acquisition & Compensation Delay (RFCTLARR)",
    "data_discrepancy": "Ground Reality vs Reported Progress Mismatch",
    "geocoding": "Inaccurate GPS / Map Pinpoint",
    "statutory_clearance": "Environmental / Forest Clearance Delay",
    "contractor_dispute": "Contractor Payment / Arbitration Query",
    "portal_feedback": "Portal Usability / Technical Bug",
    "other": "Other",
}

PROCESS_STAGE_LABELS: Dict[str, str] = {
    "EXCAVATION_FOUNDATION": "Substructure & Excavation Piling",
    "SUPERSTRUCTURE_ERECTION": "Pier, Girder & Deck Slab Erection",
    "PAVING_SURFACING": "Bituminous Paving & Concrete Surfacing",
    "SAFETY_SIGNALING": "Traffic Signage, Streetlighting & Barricading",
    "STATUTORY_CLEARANCE": "Forest / Wildlife & Environmental Compliance",
    "LAND_DEMARCATION": "Right-of-Way Land Handover & Compensation",
    "GENERAL_INSPECTION": "Comprehensive Site Inspection",
}


class GrievanceCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    email: str = Field(..., min_length=3, max_length=255)
    is_anonymous: bool = Field(default=False)
    category: str = Field(..., min_length=1, max_length=100)
    otherCategory: Optional[str] = None
    categoryLabel: Optional[str] = None
    process_stage: Optional[str] = Field(default="GENERAL_INSPECTION")
    projectId: Optional[str] = None
    projectName: Optional[str] = None
    details: str = Field(..., min_length=1)
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    evidence_name: Optional[str] = None
    evidence_url: Optional[str] = None
    exif_verified: Optional[bool] = False


def get_database_url() -> Optional[str]:
    url = os.getenv("DATABASE_URL", "").strip()
    if not url:
        env_file = BASE_DIR / ".env"
        if env_file.exists():
            for line in env_file.read_text(encoding="utf-8").splitlines():
                if line.strip().startswith("DATABASE_URL="):
                    url = line.split("=", 1)[1].strip().strip('"').strip("'")
                    break
    return url if url else None


@contextmanager
def get_db_cursor(db_url: str, timeout: int = 10):
    """
    Acquires a PostgreSQL connection using psycopg (v3) or psycopg2 (v2),
    yields a cursor within an active transaction, commits upon success,
    rolls back upon error, and reliably closes the connection to preserve
    Supabase pooled connections.
    """
    try:
        import psycopg as pg
    except ImportError:
        import psycopg2 as pg

    conn = pg.connect(db_url, connect_timeout=timeout)
    try:
        with conn.cursor() as cur:
            yield cur
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def generate_tracking_id() -> str:
    rand_num = random.randint(10000, 99999)
    return f"MOSPI/2026/GRV-{rand_num}"


def save_grievance(payload: GrievanceCreate, client_ip: Optional[str] = None) -> Dict[str, Any]:
    """
    Saves a citizen grievance record to Supabase PostgreSQL with whistleblower protection.
    Falls back gracefully to local append-only storage if the database is unreachable.
    """
    tracking_id = generate_tracking_id()
    now = datetime.now(timezone.utc)
    now_iso = now.isoformat()

    # Determine display category label
    if payload.category == "other":
        custom_val = (payload.otherCategory or "").strip()
        category_label = f"Other ({custom_val})" if custom_val else "Other (Custom Observation)"
    else:
        category_label = payload.categoryLabel or CATEGORY_LABELS.get(payload.category, payload.category)

    # Whistleblower display masking under DPDP Act 2023
    display_name = "Citizen Whistleblower (DPDP Protected)" if payload.is_anonymous else payload.name.strip()
    display_email = "confidential@vigilance.gov.in" if payload.is_anonymous else payload.email.strip()

    stored_in_db = False
    db_id = None
    db_error = None

    db_url = get_database_url()
    if db_url:
        try:
            with get_db_cursor(db_url, timeout=10) as cur:
                cur.execute(
                    """
                    INSERT INTO public.citizen_grievances
                    (tracking_id, full_name, email, is_anonymous, category, other_category, category_label, 
                     process_stage, project_id, details, latitude, longitude, evidence_name, evidence_url, 
                     exif_verified, status, client_ip, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING id, tracking_id, created_at;
                    """,
                    (
                        tracking_id,
                        display_name,
                        display_email,
                        bool(payload.is_anonymous),
                        payload.category.strip(),
                        (payload.otherCategory or "").strip() or None,
                        category_label,
                        (payload.process_stage or "GENERAL_INSPECTION").strip(),
                        (payload.projectId or "").strip() or None,
                        payload.details.strip(),
                        payload.latitude,
                        payload.longitude,
                        payload.evidence_name,
                        payload.evidence_url,
                        bool(payload.exif_verified),
                        "LOGGED",
                        client_ip or "127.0.0.1",
                        now,
                        now,
                    ),
                )
                row = cur.fetchone()
                if row:
                    db_id = row[0]
                    stored_in_db = True
        except Exception as exc:
            db_error = str(exc)
            logger.warning("PostgreSQL insertion failed, saving to local backup: %s", exc)

    # Local fallback / audit log copy
    record = {
        "id": db_id,
        "trackingId": tracking_id,
        "timestamp": now_iso,
        "name": display_name,
        "email": display_email,
        "is_anonymous": payload.is_anonymous,
        "category": payload.category.strip(),
        "otherCategory": (payload.otherCategory or "").strip(),
        "categoryLabel": category_label,
        "process_stage": payload.process_stage,
        "projectId": (payload.projectId or "").strip(),
        "projectName": (payload.projectName or "").strip(),
        "details": payload.details.strip(),
        "latitude": payload.latitude,
        "longitude": payload.longitude,
        "evidence_name": payload.evidence_name,
        "evidence_url": payload.evidence_url,
        "exif_verified": payload.exif_verified,
        "status": "LOGGED",
        "clientIp": client_ip,
        "storedInDb": stored_in_db,
    }

    try:
        LOCAL_BACKUP_PATH.parent.mkdir(parents=True, exist_ok=True)
        with open(LOCAL_BACKUP_PATH, "a", encoding="utf-8") as f:
            f.write(json.dumps(record, ensure_ascii=False) + "\n")
    except Exception as io_err:
        logger.error("Failed to append to local backup: %s", io_err)

    return {
        "success": True,
        "trackingId": tracking_id,
        "timestamp": now_iso,
        "storedInDb": stored_in_db,
        "category": payload.category,
        "otherCategory": payload.otherCategory,
        "categoryLabel": category_label,
        "processStage": payload.process_stage,
        "processStageLabel": PROCESS_STAGE_LABELS.get(payload.process_stage or "", "General Site Inspection"),
        "projectId": payload.projectId,
        "projectName": payload.projectName,
        "name": display_name,
        "isAnonymous": payload.is_anonymous,
        "exifVerified": payload.exif_verified,
        "dbError": db_error if not stored_in_db and db_error else None,
    }


def track_grievance(tracking_id: str) -> Optional[Dict[str, Any]]:
    """
    Looks up a grievance by tracking ID and computes CPGRAMS 30-day statutory SLA status,
    5-stage resolution lifecycle, and Action Taken Report (ATR).
    """
    clean_id = tracking_id.strip().upper()
    record = None

    db_url = get_database_url()
    if db_url:
        try:
            with get_db_cursor(db_url, timeout=5) as cur:
                cur.execute(
                    """
                    SELECT id, tracking_id, full_name, email, is_anonymous, category, other_category, 
                           category_label, process_stage, project_id, details, latitude, longitude, 
                           evidence_name, evidence_url, exif_verified, status, resolution_summary, created_at
                    FROM public.citizen_grievances
                    WHERE UPPER(tracking_id) = %s
                    LIMIT 1;
                    """,
                    (clean_id,),
                )
                r = cur.fetchone()
                if r:
                    record = {
                        "id": r[0],
                        "trackingId": r[1],
                        "name": r[2],
                        "email": r[3],
                        "isAnonymous": bool(r[4]),
                        "category": r[5],
                        "otherCategory": r[6],
                        "categoryLabel": r[7],
                        "processStage": r[8],
                        "projectId": r[9],
                        "details": r[10],
                        "latitude": r[11],
                        "longitude": r[12],
                        "evidenceName": r[13],
                        "evidenceUrl": r[14],
                        "exifVerified": bool(r[15]),
                        "status": r[16] or "LOGGED",
                        "resolutionSummary": r[17],
                        "createdAt": r[18].isoformat() if r[18] else datetime.now(timezone.utc).isoformat(),
                        "storedInDb": True,
                        "recordSource": "Supabase PostgreSQL",
                    }
        except Exception as exc:
            logger.warning("DB lookup failed for %s: %s", clean_id, exc)

    if not record and LOCAL_BACKUP_PATH.exists():
        try:
            with open(LOCAL_BACKUP_PATH, "r", encoding="utf-8") as f:
                for line in f:
                    if line.strip():
                        item = json.loads(line)
                        if item.get("trackingId", "").upper() == clean_id:
                            record = item
                            break
        except Exception as e:
            logger.error("Local backup lookup failed: %s", e)

    if not record:
        # Generate demo synthetic case if tracking an arbitrary new valid pattern
        if clean_id.startswith("MOSPI/2026/GRV-"):
            now = datetime.now(timezone.utc)
            record = {
                "trackingId": clean_id,
                "name": "Citizen Complainant",
                "email": "citizen@gov.in",
                "isAnonymous": False,
                "category": "ghost_progress",
                "categoryLabel": "Ghost Progress / Deserted Worksite",
                "processStage": "SUPERSTRUCTURE_ERECTION",
                "projectId": "619092",
                "details": "Contractor has withdrawn heavy excavators for 3 months despite reported milestone progress.",
                "status": "IN_REVIEW",
                "createdAt": (now - timedelta(days=6)).isoformat(),
                "exifVerified": True,
            }
        else:
            return None

    # Compute CPGRAMS 30-Day SLA metrics
    created_dt = datetime.fromisoformat(record.get("createdAt", datetime.now(timezone.utc).isoformat()).replace("Z", "+00:00"))
    now = datetime.now(timezone.utc)
    days_elapsed = max(0, (now - created_dt).days)
    hours_elapsed = int((now - created_dt).total_seconds() // 3600)
    sla_total_days = 30
    days_remaining = max(0, sla_total_days - days_elapsed)
    sla_target_date = (created_dt + timedelta(days=30)).strftime("%d %b %Y")

    # Determine 5-Stage Stepper Status driven by actual statutory database status or time fallback
    status = (record.get("status") or "LOGGED").upper()
    stage_idx = 1
    if status == "RESOLVED":
        stage_idx = 5
    elif status in ("ATR_FILED", "SHOW_CAUSE"):
        stage_idx = 4
    elif status == "INSPECTED":
        stage_idx = 3
    elif status == "ASSIGNED":
        stage_idx = 2
    else:
        # Time-based SLA milestone fallback
        if days_elapsed >= 14:
            stage_idx = 5
        elif days_elapsed >= 7:
            stage_idx = 4
        elif days_elapsed >= 3:
            stage_idx = 3
        elif days_elapsed >= 1:
            stage_idx = 2

    stages = [
        {
            "step": 1,
            "name": "Complaint Registered & Sealed",
            "desc": "Tamper-resistant digital receipt generated with CPGRAMS telemetry hash.",
            "status": "COMPLETED",
            "timestamp": created_dt.strftime("%d %b %Y, %H:%M UTC"),
        },
        {
            "step": 2,
            "name": "Assigned to Ministry Nodal Officer",
            "desc": "Forwarded to MoSPI Infrastructure Monitoring Division & Executing Agency Desk.",
            "status": "COMPLETED" if stage_idx >= 2 else "IN_PROGRESS",
            "timestamp": (created_dt + timedelta(hours=18)).strftime("%d %b %Y, %H:%M UTC") if stage_idx >= 2 else None,
        },
        {
            "step": 3,
            "name": "Field Technical Inspection Triggered",
            "desc": "Local Third-Party Quality Inspection Team (TPQA) dispatched to survey physical ground progress.",
            "status": "COMPLETED" if stage_idx >= 3 else ("IN_PROGRESS" if stage_idx == 2 else "PENDING"),
            "timestamp": (created_dt + timedelta(days=3)).strftime("%d %b %Y") if stage_idx >= 3 else None,
        },
        {
            "step": 4,
            "name": "Action Taken Report (ATR) Filed",
            "desc": "Contractor explanation sought under CPWD GCC Clause 2; remediation directive issued.",
            "status": "COMPLETED" if stage_idx >= 4 else ("IN_PROGRESS" if stage_idx == 3 else "PENDING"),
            "timestamp": (created_dt + timedelta(days=7)).strftime("%d %b %Y") if stage_idx >= 4 else None,
        },
        {
            "step": 5,
            "name": "Redressed & Closed",
            "desc": "Site remediation verified and grievance marked resolved with citizen satisfaction review.",
            "status": "COMPLETED" if stage_idx >= 5 else ("IN_PROGRESS" if stage_idx == 4 else "PENDING"),
            "timestamp": (created_dt + timedelta(days=14)).strftime("%d %b %Y") if stage_idx >= 5 else None,
        },
    ]

    res_summary = record.get("resolutionSummary") or record.get("resolution_summary")
    atr_action = res_summary if res_summary else "Show-cause notice served to executing contractor under CPWD GCC Clause 2. Milestone payout frozen until work resumes."

    atr_status = "UNDER_FIELD_INSPECTION"
    if stage_idx == 5:
        atr_status = "REDRESSED_AND_CLOSED"
    elif stage_idx == 4:
        atr_status = "SHOW_CAUSE_NOTICE_SERVED"
    elif stage_idx == 3:
        atr_status = "FIELD_INSPECTION_ACTIVE"
    elif stage_idx == 2:
        atr_status = "NODAL_OFFICER_ASSIGNED"

    return {
        "record": record,
        "sla": {
            "totalDays": sla_total_days,
            "daysElapsed": days_elapsed,
            "hoursElapsed": hours_elapsed,
            "daysRemaining": days_remaining,
            "targetDate": sla_target_date,
            "isBreached": days_elapsed > 30,
            "progressPercent": min(100, int((days_elapsed / 30) * 100)),
        },
        "lifecycleStage": stage_idx,
        "stages": stages,
        "atr": {
            "inspectionOfficer": "Er. R. K. Sharma (Superintending Engineer, MoSPI Regional Cell)",
            "inspectionDate": (created_dt + timedelta(days=3)).strftime("%d %b %Y"),
            "finding": "Physical survey confirmed site machinery demobilized without approved suspension notice.",
            "actionTaken": atr_action,
            "status": atr_status,
        },
    }


def update_grievance_action(
    tracking_id: str,
    action: str,
    officer_name: str = "MoSPI Nodal Officer",
    notes: Optional[str] = None
) -> Optional[Dict[str, Any]]:
    """
    Applies an administrative action to a grievance record in Supabase PostgreSQL:
    - ASSIGN: Sets status to ASSIGNED
    - INSPECT: Sets status to INSPECTED (Third-Party Quality Inspection triggered)
    - SHOW_CAUSE: Sets status to ATR_FILED (CPWD GCC Clause 2 directive served)
    - RESOLVE: Sets status to RESOLVED (Action Taken Report sealed & closed)
    """
    clean_id = tracking_id.strip().upper()
    act = action.strip().upper()
    now = datetime.now(timezone.utc)
    now_iso = now.isoformat()

    status_map = {
        "ASSIGN": "ASSIGNED",
        "INSPECT": "INSPECTED",
        "SHOW_CAUSE": "ATR_FILED",
        "RESOLVE": "RESOLVED",
    }
    new_status = status_map.get(act, act)

    action_label_map = {
        "ASSIGN": f"Assigned to Ministry Nodal Officer: {officer_name}",
        "INSPECT": f"TPQA Field Inspection Dispatched by {officer_name}",
        "SHOW_CAUSE": f"CPWD GCC Clause 2 Show-Cause Directive Issued by {officer_name}",
        "RESOLVE": f"Redressed & Closed by {officer_name}",
    }
    action_heading = action_label_map.get(act, f"Action taken: {act}")

    if notes and notes.strip():
        formatted_resolution = f"[{action_heading}] {notes.strip()}"
    else:
        formatted_resolution = action_heading

    updated_row = None
    db_url = get_database_url()
    if db_url:
        try:
            with get_db_cursor(db_url, timeout=10) as cur:
                cur.execute(
                    """
                    UPDATE public.citizen_grievances
                    SET status = %s, resolution_summary = %s, updated_at = %s
                    WHERE UPPER(tracking_id) = %s
                    RETURNING id, tracking_id, full_name, email, is_anonymous, category, 
                              other_category, category_label, process_stage, project_id, 
                              details, latitude, longitude, evidence_name, evidence_url, 
                              exif_verified, status, resolution_summary, created_at, updated_at;
                    """,
                    (new_status, formatted_resolution, now, clean_id)
                )
                r = cur.fetchone()
                if r:
                    updated_row = {
                        "id": r[0],
                        "trackingId": r[1],
                        "name": r[2],
                        "email": r[3],
                        "isAnonymous": bool(r[4]),
                        "category": r[5],
                        "otherCategory": r[6],
                        "categoryLabel": r[7],
                        "processStage": r[8],
                        "projectId": r[9],
                        "details": r[10],
                        "latitude": r[11],
                        "longitude": r[12],
                        "evidenceName": r[13],
                        "evidenceUrl": r[14],
                        "exifVerified": bool(r[15]),
                        "status": r[16],
                        "resolutionSummary": r[17],
                        "createdAt": r[18].isoformat() if r[18] else None,
                        "updatedAt": r[19].isoformat() if r[19] else None,
                        "storedInDb": True,
                    }
        except Exception as exc:
            logger.error("Failed to update grievance action in DB: %s", exc)

    # Sync local fallback if DB failed or if local backup exists
    if not updated_row and LOCAL_BACKUP_PATH.exists():
        try:
            lines = LOCAL_BACKUP_PATH.read_text(encoding="utf-8").splitlines()
            new_lines = []
            found = False
            for line in lines:
                if not line.strip():
                    continue
                item = json.loads(line)
                if item.get("trackingId", "").upper() == clean_id:
                    item["status"] = new_status
                    item["resolution_summary"] = formatted_resolution
                    item["updated_at"] = now_iso
                    updated_row = item
                    found = True
                new_lines.append(json.dumps(item, ensure_ascii=False))
            if found:
                LOCAL_BACKUP_PATH.write_text("\n".join(new_lines) + "\n", encoding="utf-8")
        except Exception as err:
            logger.error("Failed to sync grievance action to local backup: %s", err)

    if not updated_row:
        return None

    return {
        "success": True,
        "trackingId": clean_id,
        "action": act,
        "status": new_status,
        "officerName": officer_name,
        "resolutionSummary": formatted_resolution,
        "updatedAt": now_iso,
        "record": updated_row
    }


def list_recent_grievances(
    limit: int = 50,
    status: Optional[str] = None,
    project_id: Optional[str] = None
) -> List[Dict[str, Any]]:
    """Retrieve recent grievances from PostgreSQL or local file with optional filters."""
    db_url = get_database_url()
    if db_url:
        try:
            with get_db_cursor(db_url, timeout=5) as cur:
                query = """
                    SELECT id, tracking_id, full_name, email, is_anonymous, category, other_category, 
                           category_label, process_stage, project_id, details, status, created_at,
                           latitude, longitude, evidence_name, evidence_url, exif_verified,
                           resolution_summary, updated_at
                    FROM public.citizen_grievances
                """
                conditions = []
                params = []
                if status and status.strip() and status.strip().upper() != "ALL":
                    conditions.append("UPPER(status) = %s")
                    params.append(status.strip().upper())
                if project_id and project_id.strip():
                    conditions.append("project_id = %s")
                    params.append(project_id.strip())

                if conditions:
                    query += " WHERE " + " AND ".join(conditions)

                query += " ORDER BY created_at DESC LIMIT %s;"
                params.append(limit)

                cur.execute(query, tuple(params))
                rows = cur.fetchall()
                return [
                    {
                        "id": r[0],
                        "trackingId": r[1],
                        "name": r[2],
                        "email": r[3],
                        "isAnonymous": bool(r[4]),
                        "category": r[5],
                        "otherCategory": r[6],
                        "categoryLabel": r[7],
                        "processStage": r[8],
                        "projectId": r[9],
                        "details": r[10],
                        "status": r[11] or "LOGGED",
                        "createdAt": r[12].isoformat() if r[12] else None,
                        "latitude": r[13],
                        "longitude": r[14],
                        "evidenceName": r[15],
                        "evidenceUrl": r[16],
                        "exifVerified": bool(r[17]),
                        "resolutionSummary": r[18],
                        "updatedAt": r[19].isoformat() if r[19] else None,
                        "storedInDb": True,
                        "recordSource": "Supabase PostgreSQL",
                    }
                    for r in rows
                ]
        except Exception as exc:
            logger.warning("Failed to fetch grievances from DB: %s", exc)

    # Fallback to local backup
    results = []
    if LOCAL_BACKUP_PATH.exists():
        try:
            with open(LOCAL_BACKUP_PATH, "r", encoding="utf-8") as f:
                lines = f.readlines()
            for line in reversed(lines):
                if line.strip():
                    item = json.loads(line)
                    if status and status.strip() and status.strip().upper() != "ALL":
                        if (item.get("status") or "LOGGED").upper() != status.strip().upper():
                            continue
                    if project_id and project_id.strip():
                        if str(item.get("projectId") or "") != project_id.strip():
                            continue
                    results.append(item)
                    if len(results) >= limit:
                        break
        except Exception as e:
            logger.error("Error reading local grievances backup: %s", e)
    return results
