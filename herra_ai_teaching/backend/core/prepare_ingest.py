"""
Prepare Ingest (Phase 1.3.3.2 - Option A)

Purpose:
- Convert raw input into an ingest-ready representation:
  - prepared_text (normalized & minimally structured)
  - chunks (UI-friendly segments for preview)
- Uses the existing recommendation engine
- Does NOT store anything in the DB
"""

from __future__ import annotations

from typing import Any, Dict, List

from backend.core.format_recommendation import recommend_format


def _split_by_blank_lines(text: str) -> List[str]:
    parts = []
    buff = []
    for line in text.split("\n"):
        if line.strip() == "":
            if buff:
                parts.append("\n".join(buff).strip())
                buff = []
        else:
            buff.append(line)
    if buff:
        parts.append("\n".join(buff).strip())
    return [p for p in parts if p]


def _chunk_by_size(paragraphs: List[str], max_chars: int) -> List[str]:
    chunks: List[str] = []
    current: List[str] = []
    current_len = 0

    for p in paragraphs:
        add_len = len(p) + (2 if current else 0)
        if current and (current_len + add_len) > max_chars:
            chunks.append("\n\n".join(current).strip())
            current = [p]
            current_len = len(p)
        else:
            current.append(p)
            current_len += add_len

    if current:
        chunks.append("\n\n".join(current).strip())

    return [c for c in chunks if c]


def _prepare_heading_chunks(text: str) -> Dict[str, Any]:
    # Minimal: ensure consistent newlines; rely on headings already present
    paragraphs = _split_by_blank_lines(text)
    return {
        "prepared_text": text,
        "chunks": _chunk_by_size(paragraphs, max_chars=700),
    }


def _prepare_code_blocks(text: str) -> Dict[str, Any]:
    # Minimal: keep code fences intact; chunk by paragraph size
    paragraphs = _split_by_blank_lines(text)
    return {
        "prepared_text": text,
        "chunks": _chunk_by_size(paragraphs, max_chars=900),
    }


def _prepare_raw(text: str) -> Dict[str, Any]:
    paragraphs = _split_by_blank_lines(text)
    return {
        "prepared_text": text,
        "chunks": _chunk_by_size(paragraphs, max_chars=600),
    }


def prepare_for_ingest(sample_text: str) -> Dict[str, Any]:
    """
    Returns a recommendation + ingest-ready text/chunks.

    Output schema is stable for future UI integration.
    """
    recommendation = recommend_format(sample_text)

    normalized_text = recommendation.get("preview", {}).get("normalized_text", sample_text)
    recommended_format = recommendation.get("recommended_format", "raw")

    if recommended_format == "heading_chunks":
        prepared = _prepare_heading_chunks(normalized_text)
    elif recommended_format == "code_blocks":
        prepared = _prepare_code_blocks(normalized_text)
    else:
        prepared = _prepare_raw(normalized_text)

    chunks = prepared["chunks"]

    return {
        "recommended_format": recommended_format,
        "plan": recommendation.get("plan", {}),
        "prepared_text": prepared["prepared_text"],
        "chunks": chunks,
        "chunk_count": len(chunks),
    }
