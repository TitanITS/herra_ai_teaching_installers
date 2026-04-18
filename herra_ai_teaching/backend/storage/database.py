import json
import sqlite3
from pathlib import Path
from datetime import datetime
from typing import Optional, Any, Dict, List

DB_PATH = Path("herra_ai_teaching.db")


# =========================================================
# Connection helpers
# =========================================================
def get_conn() -> sqlite3.Connection:
    return sqlite3.connect(DB_PATH, check_same_thread=False)


def _column_exists(cursor: sqlite3.Cursor, table: str, column: str) -> bool:
    cursor.execute(f"PRAGMA table_info({table})")
    cols = [r[1] for r in cursor.fetchall()]
    return column in cols


def _add_column_safe(cursor: sqlite3.Cursor, table: str, column_def: str) -> None:
    col_name = column_def.split()[0].strip()
    if not _column_exists(cursor, table, col_name):
        cursor.execute(f"ALTER TABLE {table} ADD COLUMN {column_def}")


# =========================================================
# Init / Migrations
# =========================================================
def init_db() -> None:
    conn = get_conn()
    cursor = conn.cursor()

    # -----------------------------
    # ingested_text
    # -----------------------------
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS ingested_text (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        text TEXT NOT NULL,
        tokens INTEGER NOT NULL,
        penalized INTEGER DEFAULT 0,
        created_at TEXT NOT NULL
    )
    """)

    _add_column_safe(cursor, "ingested_text", "tokens INTEGER DEFAULT 0")
    _add_column_safe(cursor, "ingested_text", "penalized INTEGER DEFAULT 0")
    _add_column_safe(cursor, "ingested_text", "created_at TEXT DEFAULT ''")

    _add_column_safe(cursor, "ingested_text", "detected_type TEXT")
    _add_column_safe(cursor, "ingested_text", "recommended_format TEXT")
    _add_column_safe(cursor, "ingested_text", "analysis_confidence REAL")
    _add_column_safe(cursor, "ingested_text", "trust_score REAL")
    _add_column_safe(cursor, "ingested_text", "trust_label TEXT")
    _add_column_safe(cursor, "ingested_text", "ai_source TEXT")

    # -----------------------------
    # audit_log
    # -----------------------------
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS audit_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action TEXT NOT NULL,
        reference_id INTEGER,
        created_at TEXT NOT NULL
    )
    """)

    _add_column_safe(cursor, "audit_log", "reference_id INTEGER")
    _add_column_safe(cursor, "audit_log", "created_at TEXT DEFAULT ''")

    # -----------------------------
    # ai_settings
    # -----------------------------
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS ai_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL
    )
    """)

    cursor.execute("SELECT value FROM ai_settings WHERE key = ?", ("active_ai_source",))
    row = cursor.fetchone()
    if row is None:
        cursor.execute(
            "INSERT INTO ai_settings (key, value, updated_at) VALUES (?, ?, ?)",
            ("active_ai_source", "mock", datetime.utcnow().isoformat()),
        )

    # -----------------------------
    # ai_runtime_profile (NEW Step 5A)
    # -----------------------------
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS ai_runtime_profile (
        profile_key TEXT PRIMARY KEY,
        mode TEXT NOT NULL,
        provider_key TEXT,
        model_key TEXT,
        notes TEXT,
        updated_at TEXT NOT NULL
    )
    """)

    cursor.execute("SELECT profile_key FROM ai_runtime_profile WHERE profile_key = ?", ("default",))
    row = cursor.fetchone()
    if row is None:
        cursor.execute("""
            INSERT INTO ai_runtime_profile
            (profile_key, mode, provider_key, model_key, notes, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
        """, ("default", "manual", "openai", "gpt-4o-mini", "", datetime.utcnow().isoformat()))

    # -----------------------------
    # connectors
    # -----------------------------
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS connectors (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        os TEXT NOT NULL,
        created_at TEXT NOT NULL,
        last_seen TEXT NOT NULL,
        meta_json TEXT NOT NULL DEFAULT '{}'
    )
    """)

    _add_column_safe(cursor, "connectors", "meta_json TEXT DEFAULT '{}'")
    _add_column_safe(cursor, "connectors", "last_seen TEXT DEFAULT ''")
    _add_column_safe(cursor, "connectors", "created_at TEXT DEFAULT ''")

    # -----------------------------
    # connector_bootstrap_tokens
    # -----------------------------
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS connector_bootstrap_tokens (
        id TEXT PRIMARY KEY,
        token TEXT NOT NULL UNIQUE,
        label TEXT NOT NULL,
        created_at TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        used INTEGER NOT NULL DEFAULT 0,
        used_at TEXT,
        used_by_name TEXT
    )
    """)

    _add_column_safe(cursor, "connector_bootstrap_tokens", "used INTEGER DEFAULT 0")
    _add_column_safe(cursor, "connector_bootstrap_tokens", "used_at TEXT")
    _add_column_safe(cursor, "connector_bootstrap_tokens", "used_by_name TEXT")

    # -----------------------------
    # jobs
    # -----------------------------
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS jobs (
        job_id TEXT PRIMARY KEY,
        job_type TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        requested_by TEXT,
        input_json TEXT NOT NULL DEFAULT '{}',
        logs_json TEXT NOT NULL DEFAULT '[]',
        result_json TEXT,
        error TEXT
    )
    """)

    _add_column_safe(cursor, "jobs", "requested_by TEXT")
    _add_column_safe(cursor, "jobs", "input_json TEXT DEFAULT '{}'")
    _add_column_safe(cursor, "jobs", "logs_json TEXT DEFAULT '[]'")
    _add_column_safe(cursor, "jobs", "result_json TEXT")
    _add_column_safe(cursor, "jobs", "error TEXT")
    _add_column_safe(cursor, "jobs", "updated_at TEXT DEFAULT ''")

    conn.commit()
    conn.close()


# =========================================================
# AUDIT
# =========================================================
def log_audit(action: str, reference_id: Optional[int] = None) -> None:
    conn = get_conn()
    cursor = conn.cursor()

    cursor.execute(
        "INSERT INTO audit_log (action, reference_id, created_at) VALUES (?, ?, ?)",
        (action, reference_id, datetime.utcnow().isoformat()),
    )

    conn.commit()
    conn.close()


def fetch_audit_log() -> List[Dict[str, Any]]:
    conn = get_conn()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT id, action, reference_id, created_at
        FROM audit_log
        ORDER BY id DESC
    """)
    rows = cursor.fetchall()
    conn.close()

    return [
        {
            "id": r[0],
            "action": r[1],
            "reference_id": r[2],
            "created_at": r[3],
        }
        for r in rows
    ]


# =========================================================
# INGEST / LIST / PENALIZE
# =========================================================
def insert_text(
    text: str,
    *,
    detected_type: Optional[str] = None,
    recommended_format: Optional[str] = None,
    analysis_confidence: Optional[float] = None,
    trust_score: Optional[float] = None,
    trust_label: Optional[str] = None,
    ai_source: Optional[str] = None,
) -> int:
    cleaned = (text or "").strip()
    tokens = len(cleaned.split())

    conn = get_conn()
    cursor = conn.cursor()

    cursor.execute(
        """
        INSERT INTO ingested_text (
            text, tokens, penalized, created_at,
            detected_type, recommended_format, analysis_confidence,
            trust_score, trust_label, ai_source
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            cleaned,
            tokens,
            0,
            datetime.utcnow().isoformat(),
            detected_type,
            recommended_format,
            analysis_confidence,
            trust_score,
            trust_label,
            ai_source,
        ),
    )
    entry_id = int(cursor.lastrowid)

    conn.commit()
    conn.close()

    log_audit("ingest", entry_id)
    return entry_id


def list_text() -> List[Dict[str, Any]]:
    conn = get_conn()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT
            id, text, tokens, penalized, created_at,
            detected_type, recommended_format, analysis_confidence,
            trust_score, trust_label, ai_source
        FROM ingested_text
        ORDER BY id DESC
    """)
    rows = cursor.fetchall()
    conn.close()

    return [
        {
            "id": r[0],
            "text": r[1],
            "tokens": r[2],
            "penalized": bool(r[3]),
            "created_at": r[4],
            "detected_type": r[5],
            "recommended_format": r[6],
            "analysis_confidence": r[7],
            "trust_score": r[8],
            "trust_label": r[9],
            "ai_source": r[10],
        }
        for r in rows
    ]


def penalize_text(entry_id: int) -> None:
    conn = get_conn()
    cursor = conn.cursor()

    cursor.execute(
        "UPDATE ingested_text SET penalized = 1 WHERE id = ?",
        (entry_id,),
    )

    conn.commit()
    conn.close()

    log_audit("penalize", entry_id)


# =========================================================
# TRUST / CONFIDENCE
# =========================================================
def trust_stats() -> Dict[str, Any]:
    conn = get_conn()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) FROM ingested_text")
    total = int(cursor.fetchone()[0] or 0)

    cursor.execute("SELECT COUNT(*) FROM ingested_text WHERE penalized = 0")
    trusted = int(cursor.fetchone()[0] or 0)

    cursor.execute("SELECT AVG(trust_score) FROM ingested_text WHERE trust_score IS NOT NULL")
    avg_trust = float(cursor.fetchone()[0] or 0.0)

    conn.close()

    if total == 0:
        trust_level = "unknown"
    elif avg_trust >= 0.85:
        trust_level = "high"
    elif avg_trust >= 0.65:
        trust_level = "medium"
    else:
        trust_level = "low"

    return {
        "total": total,
        "trusted": trusted,
        "penalized": total - trusted,
        "average_trust_score": round(avg_trust, 4),
        "trust_level": trust_level,
    }


def fetch_trust() -> Dict[str, Any]:
    return trust_stats()


def confidence_score() -> Dict[str, Any]:
    conn = get_conn()
    cursor = conn.cursor()

    cursor.execute("SELECT AVG(tokens) FROM ingested_text")
    avg_tokens = float(cursor.fetchone()[0] or 0)

    cursor.execute("SELECT AVG(analysis_confidence) FROM ingested_text WHERE analysis_confidence IS NOT NULL")
    avg_analysis_conf = float(cursor.fetchone()[0] or 0.0)

    cursor.execute("SELECT COUNT(*) FROM ingested_text")
    total = int(cursor.fetchone()[0] or 0)

    conn.close()

    if total == 0:
        confidence = "unknown"
        score = 0.0
    else:
        score = avg_analysis_conf if avg_analysis_conf > 0 else 0.5
        if score >= 0.85:
            confidence = "high"
        elif score >= 0.65:
            confidence = "medium"
        else:
            confidence = "low"

    return {
        "average_tokens": int(avg_tokens),
        "confidence": confidence,
        "confidence_score": round(score, 4),
        "analyzed_entries": total,
    }


def fetch_confidence() -> Dict[str, Any]:
    return confidence_score()


# =========================================================
# AI SETTINGS / RUNTIME PROFILE
# =========================================================
def get_active_ai_source() -> str:
    conn = get_conn()
    cursor = conn.cursor()

    cursor.execute("SELECT value FROM ai_settings WHERE key = ?", ("active_ai_source",))
    row = cursor.fetchone()

    conn.close()

    if not row:
        set_active_ai_source("mock")
        return "mock"

    return str(row[0])


def set_active_ai_source(source_key: str) -> str:
    key = (source_key or "").strip()
    if not key:
        key = "mock"

    conn = get_conn()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO ai_settings (key, value, updated_at)
        VALUES (?, ?, ?)
        ON CONFLICT(key) DO UPDATE SET
            value = excluded.value,
            updated_at = excluded.updated_at
    """, ("active_ai_source", key, datetime.utcnow().isoformat()))

    conn.commit()
    conn.close()

    log_audit("set_active_ai_source", None)
    return key


def get_ai_runtime_profile() -> Dict[str, Any]:
    conn = get_conn()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT profile_key, mode, provider_key, model_key, notes, updated_at
        FROM ai_runtime_profile
        WHERE profile_key = ?
    """, ("default",))
    row = cursor.fetchone()
    conn.close()

    if row is None:
        profile = {
            "profile_key": "default",
            "mode": "manual",
            "provider_key": "openai",
            "model_key": "gpt-4o-mini",
            "notes": "",
            "updated_at": datetime.utcnow().isoformat(),
        }
        set_ai_runtime_profile(
            mode=profile["mode"],
            provider_key=profile["provider_key"],
            model_key=profile["model_key"],
            notes=profile["notes"],
        )
        return profile

    return {
        "profile_key": row[0],
        "mode": row[1],
        "provider_key": row[2],
        "model_key": row[3],
        "notes": row[4] or "",
        "updated_at": row[5],
    }


def set_ai_runtime_profile(
    *,
    mode: str,
    provider_key: Optional[str],
    model_key: Optional[str],
    notes: Optional[str],
) -> Dict[str, Any]:
    clean_mode = (mode or "").strip() or "manual"
    clean_provider = (provider_key or "").strip() or None
    clean_model = (model_key or "").strip() or None
    clean_notes = (notes or "").strip()
    updated_at = datetime.utcnow().isoformat()

    conn = get_conn()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO ai_runtime_profile
        (profile_key, mode, provider_key, model_key, notes, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(profile_key) DO UPDATE SET
            mode = excluded.mode,
            provider_key = excluded.provider_key,
            model_key = excluded.model_key,
            notes = excluded.notes,
            updated_at = excluded.updated_at
    """, ("default", clean_mode, clean_provider, clean_model, clean_notes, updated_at))

    conn.commit()
    conn.close()

    log_audit("set_ai_runtime_profile", None)
    return get_ai_runtime_profile()


# =========================================================
# CONNECTORS
# =========================================================
def upsert_connector(name: str, os_name: str, meta: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    clean_name = (name or "").strip()
    clean_os = (os_name or "").strip()
    meta_json = json.dumps(meta or {})
    now = datetime.utcnow().isoformat()

    conn = get_conn()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT id, created_at FROM connectors WHERE lower(name) = lower(?)",
        (clean_name,),
    )
    row = cursor.fetchone()

    if row is None:
        import uuid
        connector_id = str(uuid.uuid4())
        created_at = now
        cursor.execute("""
            INSERT INTO connectors (id, name, os, created_at, last_seen, meta_json)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (connector_id, clean_name, clean_os, created_at, now, meta_json))
    else:
        connector_id = str(row[0])
        created_at = str(row[1])
        cursor.execute("""
            UPDATE connectors
            SET os = ?, last_seen = ?, meta_json = ?
            WHERE id = ?
        """, (clean_os, now, meta_json, connector_id))

    conn.commit()
    conn.close()

    return get_connector_by_id(connector_id) or {
        "id": connector_id,
        "name": clean_name,
        "os": clean_os,
        "created_at": created_at,
        "last_seen": now,
        "meta": meta or {},
    }


def touch_connector(connector_id: str) -> Optional[Dict[str, Any]]:
    now = datetime.utcnow().isoformat()

    conn = get_conn()
    cursor = conn.cursor()
    cursor.execute("UPDATE connectors SET last_seen = ? WHERE id = ?", (now, connector_id))
    changed = cursor.rowcount
    conn.commit()
    conn.close()

    if changed <= 0:
        return None
    return get_connector_by_id(connector_id)


def get_connector_by_id(connector_id: str) -> Optional[Dict[str, Any]]:
    conn = get_conn()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, name, os, created_at, last_seen, meta_json
        FROM connectors
        WHERE id = ?
    """, (connector_id,))
    row = cursor.fetchone()
    conn.close()

    if row is None:
        return None

    try:
        meta = json.loads(row[5] or "{}")
    except Exception:
        meta = {}

    return {
        "id": row[0],
        "name": row[1],
        "os": row[2],
        "created_at": row[3],
        "last_seen": row[4],
        "meta": meta,
    }


def list_online_connectors(online_within_seconds: int = 90) -> List[Dict[str, Any]]:
    conn = get_conn()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, name, os, created_at, last_seen, meta_json
        FROM connectors
        ORDER BY last_seen DESC
    """)
    rows = cursor.fetchall()
    conn.close()

    now_dt = datetime.utcnow()
    out: List[Dict[str, Any]] = []

    for row in rows:
        try:
            last_seen_dt = datetime.fromisoformat(row[4])
            age = (now_dt - last_seen_dt).total_seconds()
        except Exception:
            age = 999999

        if age > online_within_seconds:
            continue

        try:
            meta = json.loads(row[5] or "{}")
        except Exception:
            meta = {}

        out.append(
            {
                "id": row[0],
                "name": row[1],
                "os": row[2],
                "created_at": row[3],
                "last_seen": row[4],
                "meta": meta,
            }
        )

    return out


# =========================================================
# BOOTSTRAP TOKENS
# =========================================================
def create_bootstrap_token_record(
    token_id: str,
    token: str,
    label: str,
    created_at: str,
    expires_at: str,
) -> None:
    conn = get_conn()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO connector_bootstrap_tokens
        (id, token, label, created_at, expires_at, used, used_at, used_by_name)
        VALUES (?, ?, ?, ?, ?, 0, NULL, NULL)
    """, (token_id, token, label, created_at, expires_at))
    conn.commit()
    conn.close()


def list_bootstrap_token_records() -> List[Dict[str, Any]]:
    conn = get_conn()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, token, label, created_at, expires_at, used, used_at, used_by_name
        FROM connector_bootstrap_tokens
        ORDER BY created_at DESC
    """)
    rows = cursor.fetchall()
    conn.close()

    return [
        {
            "id": r[0],
            "token": r[1],
            "label": r[2],
            "created_at": r[3],
            "expires_at": r[4],
            "used": bool(r[5]),
            "used_at": r[6],
            "used_by_name": r[7],
        }
        for r in rows
    ]


def get_bootstrap_token_record(token_value: str) -> Optional[Dict[str, Any]]:
    conn = get_conn()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, token, label, created_at, expires_at, used, used_at, used_by_name
        FROM connector_bootstrap_tokens
        WHERE token = ?
    """, (token_value,))
    row = cursor.fetchone()
    conn.close()

    if row is None:
        return None

    return {
        "id": row[0],
        "token": row[1],
        "label": row[2],
        "created_at": row[3],
        "expires_at": row[4],
        "used": bool(row[5]),
        "used_at": row[6],
        "used_by_name": row[7],
    }


def mark_bootstrap_token_used(token_value: str, connector_name: str, used_at: str) -> bool:
    conn = get_conn()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE connector_bootstrap_tokens
        SET used = 1,
            used_at = ?,
            used_by_name = ?
        WHERE token = ? AND used = 0
    """, (used_at, connector_name, token_value))
    changed = cursor.rowcount
    conn.commit()
    conn.close()
    return changed > 0


# =========================================================
# JOBS
# =========================================================
def create_job_record(job: Dict[str, Any]) -> None:
    conn = get_conn()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT OR REPLACE INTO jobs
        (job_id, job_type, status, created_at, updated_at, requested_by, input_json, logs_json, result_json, error)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        job["job_id"],
        job["job_type"],
        job["status"],
        job["created_at"],
        job["updated_at"],
        job.get("requested_by"),
        json.dumps(job.get("input") or {}),
        json.dumps(job.get("logs") or []),
        json.dumps(job.get("result")) if job.get("result") is not None else None,
        job.get("error"),
    ))
    conn.commit()
    conn.close()


def get_job_record(job_id: str) -> Optional[Dict[str, Any]]:
    conn = get_conn()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT job_id, job_type, status, created_at, updated_at, requested_by, input_json, logs_json, result_json, error
        FROM jobs
        WHERE job_id = ?
    """, (job_id,))
    row = cursor.fetchone()
    conn.close()

    if row is None:
        return None

    return _row_to_job_dict(row)


def list_job_records(limit: int = 50) -> List[Dict[str, Any]]:
    conn = get_conn()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT job_id, job_type, status, created_at, updated_at, requested_by, input_json, logs_json, result_json, error
        FROM jobs
        ORDER BY created_at DESC
        LIMIT ?
    """, (max(1, min(limit, 500)),))
    rows = cursor.fetchall()
    conn.close()

    return [_row_to_job_dict(r) for r in rows]


def append_job_log(job_id: str, line: str, updated_at: str) -> None:
    existing = get_job_record(job_id)
    if existing is None:
        return

    logs = existing.get("logs") or []
    if not isinstance(logs, list):
        logs = []
    logs.append(line)

    conn = get_conn()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE jobs
        SET logs_json = ?, updated_at = ?
        WHERE job_id = ?
    """, (json.dumps(logs), updated_at, job_id))
    conn.commit()
    conn.close()


def update_job_status(job_id: str, status: str, updated_at: str) -> None:
    conn = get_conn()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE jobs
        SET status = ?, updated_at = ?
        WHERE job_id = ?
    """, (status, updated_at, job_id))
    conn.commit()
    conn.close()


def set_job_result(job_id: str, result: Dict[str, Any], updated_at: str) -> None:
    conn = get_conn()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE jobs
        SET result_json = ?, error = NULL, status = 'succeeded', updated_at = ?
        WHERE job_id = ?
    """, (json.dumps(result), updated_at, job_id))
    conn.commit()
    conn.close()


def set_job_error(job_id: str, error: str, updated_at: str) -> None:
    conn = get_conn()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE jobs
        SET error = ?, result_json = NULL, status = 'failed', updated_at = ?
        WHERE job_id = ?
    """, (error, updated_at, job_id))
    conn.commit()
    conn.close()


def pick_next_queued_job_record(connector_id: str, updated_at: str) -> Optional[Dict[str, Any]]:
    conn = get_conn()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT job_id, job_type, status, created_at, updated_at, requested_by, input_json, logs_json, result_json, error
        FROM jobs
        WHERE status = 'queued'
        ORDER BY created_at ASC
        LIMIT 1
    """)
    row = cursor.fetchone()

    if row is None:
        conn.close()
        return None

    job = _row_to_job_dict(row)
    logs = job.get("logs") or []
    if not isinstance(logs, list):
        logs = []
    logs.append(f"Connector {connector_id} started execution.")

    cursor.execute("""
        UPDATE jobs
        SET status = 'running', updated_at = ?, logs_json = ?
        WHERE job_id = ?
    """, (updated_at, json.dumps(logs), job["job_id"]))
    conn.commit()
    conn.close()

    return get_job_record(str(job["job_id"]))


def _row_to_job_dict(row: Any) -> Dict[str, Any]:
    try:
        input_obj = json.loads(row[6] or "{}")
    except Exception:
        input_obj = {}

    try:
        logs_obj = json.loads(row[7] or "[]")
    except Exception:
        logs_obj = []

    try:
        result_obj = json.loads(row[8]) if row[8] is not None else None
    except Exception:
        result_obj = None

    return {
        "job_id": row[0],
        "job_type": row[1],
        "status": row[2],
        "created_at": row[3],
        "updated_at": row[4],
        "requested_by": row[5],
        "input": input_obj,
        "logs": logs_obj,
        "result": result_obj,
        "error": row[9],
    }


# =========================================================
# INTERNAL
# =========================================================
def _self_test() -> None:
    init_db()