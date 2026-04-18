from __future__ import annotations

from pathlib import Path
from typing import Any, Dict, List, Optional

DEFAULT_MAX_CHARS = 5000


def _safe_read_text(path: Path, max_chars: int) -> str:
    data = path.read_bytes()
    if not data:
        return ""
    try:
        text = data.decode("utf-8", errors="ignore")
    except Exception:
        text = data.decode(errors="ignore")
    return text[:max_chars]


def _chunk_by_paragraph(text: str, chunk_size: int = 600) -> List[str]:
    text = (text or "").strip()
    if not text:
        return []

    normalized = text.replace("\r\n", "\n").replace("\r", "\n")
    paras = [p.strip() for p in normalized.split("\n\n") if p.strip()]
    if not paras:
        return [normalized]

    chunks: List[str] = []
    buf: List[str] = []
    buf_len = 0

    for p in paras:
        if len(p) > chunk_size:
            if buf:
                chunks.append("\n\n".join(buf).strip())
                buf = []
                buf_len = 0
            for i in range(0, len(p), chunk_size):
                part = p[i : i + chunk_size].strip()
                if part:
                    chunks.append(part)
            continue

        if buf_len + len(p) + 2 <= chunk_size:
            buf.append(p)
            buf_len += len(p) + 2
        else:
            chunks.append("\n\n".join(buf).strip())
            buf = [p]
            buf_len = len(p)

    if buf:
        chunks.append("\n\n".join(buf).strip())

    return [c for c in chunks if c.strip()]


def _recommend_plan(prepared_text: str) -> Dict[str, Any]:
    try:
        from backend.core.format_recommendation import recommend_format  # type: ignore

        rec = recommend_format(prepared_text)
        plan = rec.get("plan")
        if isinstance(plan, dict):
            return plan
    except Exception:
        pass

    return {
        "strategy": "minimal_cleanup_then_chunk_by_paragraph",
        "chunk_size_hint": 600,
        "notes": [
            "Remove obvious noise only if needed",
            "Chunk by paragraphs",
            "Keep chunks self-contained",
        ],
    }


def _analyze_text(text: str) -> Dict[str, Any]:
    detected_type = "unknown"
    recommended_format = "raw"
    analysis_confidence = 0.5

    try:
        from backend.utils.content_classifier import classify_content  # type: ignore

        cls = classify_content(text) or {}
        detected_type = str(cls.get("detected_type") or detected_type)
        recommended_format = str(cls.get("recommended_format") or recommended_format)
        analysis_confidence = float(cls.get("confidence") or analysis_confidence)
    except Exception:
        pass

    try:
        from backend.core.format_recommendation import recommend_format as rf  # type: ignore

        rec = rf(text) or {}
        recommended_format = str(rec.get("recommended_format") or recommended_format)
        if "confidence" in rec:
            analysis_confidence = float(rec.get("confidence") or analysis_confidence)
    except Exception:
        pass

    normalized = (text or "").strip()
    token_count = len(normalized.split())
    has_alpha = any(ch.isalpha() for ch in normalized)
    weird_char_ratio = 0.0
    if normalized:
        weird = sum(1 for ch in normalized if ord(ch) < 9 or (13 < ord(ch) < 32))
        weird_char_ratio = weird / max(len(normalized), 1)

    trust_score = analysis_confidence

    if token_count == 0:
        trust_score = 0.1
    elif not has_alpha and token_count < 3:
        trust_score = min(trust_score, 0.35)
    elif weird_char_ratio > 0.05:
        trust_score = min(trust_score, 0.4)
    elif token_count >= 3:
        trust_score = min(1.0, trust_score + 0.1)

    if trust_score >= 0.85:
        trust_label = "high"
    elif trust_score >= 0.65:
        trust_label = "medium"
    else:
        trust_label = "low"

    try:
        from backend.storage.database import get_active_ai_source  # type: ignore

        ai_source = get_active_ai_source()
    except Exception:
        ai_source = "mock"

    return {
        "detected_type": detected_type,
        "recommended_format": recommended_format,
        "analysis_confidence": round(float(analysis_confidence), 4),
        "trust_score": round(float(trust_score), 4),
        "trust_label": trust_label,
        "ai_source": ai_source,
    }


def format_analysis(sample_text: str) -> Dict[str, Any]:
    text = (sample_text or "").strip()
    analysis = _analyze_text(text)
    analysis["sample_preview"] = text[:500]
    return analysis


def prepare_file(path_str: str, max_chars: int = DEFAULT_MAX_CHARS) -> Dict[str, Any]:
    p = Path(path_str).expanduser()
    resolved = p.resolve()

    if not resolved.exists():
        return {
            "status": "error",
            "error": "File not found",
            "source": {"type": "file", "path": path_str, "resolved_path": str(resolved)},
        }
    if resolved.is_dir():
        return {
            "status": "error",
            "error": "Path is a directory (expected a file)",
            "source": {"type": "file", "path": path_str, "resolved_path": str(resolved)},
        }

    prepared_text = _safe_read_text(resolved, max_chars=max_chars)
    analysis = _analyze_text(prepared_text)
    plan = _recommend_plan(prepared_text)
    chunks = _chunk_by_paragraph(prepared_text, chunk_size=int(plan["chunk_size_hint"]))

    return {
        "source": {
            "type": "file",
            "path": path_str,
            "resolved_path": str(resolved),
            "size_bytes": resolved.stat().st_size,
        },
        "prepared": {
            "recommended_format": analysis["recommended_format"],
            "detected_type": analysis["detected_type"],
            "analysis_confidence": analysis["analysis_confidence"],
            "trust_score": analysis["trust_score"],
            "trust_label": analysis["trust_label"],
            "ai_source": analysis["ai_source"],
            "plan": plan,
            "prepared_text": prepared_text,
            "chunks": chunks,
            "chunk_count": len(chunks),
        },
    }


def prepare_files(paths: List[str], max_chars: int = DEFAULT_MAX_CHARS) -> Dict[str, Any]:
    results = [prepare_file(p, max_chars=max_chars) for p in paths]
    ok_count = sum(1 for r in results if "prepared" in r)
    return {"status": "ok", "files_prepared": ok_count, "results": results}


def ingest_prepared_chunks(chunks: List[str]) -> Dict[str, Any]:
    try:
        from backend.storage.database import insert_text  # type: ignore
    except Exception as e:
        return {"status": "error", "error": f"insert_text not available: {e}"}

    inserted_ids: List[int] = []
    analyses: List[Dict[str, Any]] = []
    chunks_ingested = 0

    for c in chunks:
        c2 = (c or "").strip()
        if not c2:
            continue

        analysis = _analyze_text(c2)

        try:
            entry_id = insert_text(
                c2,
                detected_type=analysis["detected_type"],
                recommended_format=analysis["recommended_format"],
                analysis_confidence=float(analysis["analysis_confidence"]),
                trust_score=float(analysis["trust_score"]),
                trust_label=analysis["trust_label"],
                ai_source=analysis["ai_source"],
            )
            if isinstance(entry_id, int):
                inserted_ids.append(entry_id)
            analyses.append(analysis)
            chunks_ingested += 1
        except Exception:
            continue

    avg_trust = 0.0
    avg_conf = 0.0
    if analyses:
        avg_trust = sum(float(a["trust_score"]) for a in analyses) / len(analyses)
        avg_conf = sum(float(a["analysis_confidence"]) for a in analyses) / len(analyses)

    return {
        "status": "ok",
        "chunks_ingested": chunks_ingested,
        "entry_ids": inserted_ids,
        "analysis_summary": {
            "average_trust_score": round(avg_trust, 4),
            "average_analysis_confidence": round(avg_conf, 4),
        },
    }


def ingest_file(path_str: str, max_chars: Optional[int] = None) -> Dict[str, Any]:
    max_chars = DEFAULT_MAX_CHARS if max_chars is None else int(max_chars)
    prepared = prepare_file(path_str, max_chars=max_chars)

    if "prepared" not in prepared:
        return {"status": "error", "detail": prepared}

    chunks = prepared["prepared"]["chunks"]
    ingest_result = ingest_prepared_chunks(chunks)

    return {
        "status": ingest_result.get("status", "ok"),
        "source": prepared.get("source"),
        "prepared": {
            "recommended_format": prepared["prepared"]["recommended_format"],
            "detected_type": prepared["prepared"]["detected_type"],
            "analysis_confidence": prepared["prepared"]["analysis_confidence"],
            "trust_score": prepared["prepared"]["trust_score"],
            "trust_label": prepared["prepared"]["trust_label"],
            "chunk_count": prepared["prepared"]["chunk_count"],
        },
        "chunks_ingested": ingest_result.get("chunks_ingested", 0),
        "entry_ids": ingest_result.get("entry_ids", []),
        "analysis_summary": ingest_result.get("analysis_summary", {}),
    }


def ingest_files(paths: List[str], max_chars: Optional[int] = None) -> Dict[str, Any]:
    max_chars = DEFAULT_MAX_CHARS if max_chars is None else int(max_chars)

    prepared_batch = prepare_files(paths, max_chars=max_chars)
    results_out: List[Dict[str, Any]] = []

    total_chunks_ingested = 0
    total_files = 0

    for r in prepared_batch.get("results", []):
        if "prepared" not in r:
            results_out.append({"status": "error", "detail": r})
            continue

        total_files += 1
        chunks = r["prepared"]["chunks"]
        ingest_result = ingest_prepared_chunks(chunks)

        total_chunks_ingested += int(ingest_result.get("chunks_ingested", 0))
        results_out.append(
            {
                "status": ingest_result.get("status", "ok"),
                "file": r.get("source"),
                "prepared": {
                    "recommended_format": r["prepared"]["recommended_format"],
                    "detected_type": r["prepared"]["detected_type"],
                    "analysis_confidence": r["prepared"]["analysis_confidence"],
                    "trust_score": r["prepared"]["trust_score"],
                    "trust_label": r["prepared"]["trust_label"],
                    "chunk_count": r["prepared"]["chunk_count"],
                },
                "chunks_ingested": ingest_result.get("chunks_ingested", 0),
                "entry_ids": ingest_result.get("entry_ids", []),
                "analysis_summary": ingest_result.get("analysis_summary", {}),
            }
        )

    return {
        "status": "ok",
        "files_ingested": total_files,
        "chunks_ingested": total_chunks_ingested,
        "results": results_out,
    }