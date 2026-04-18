"""
Format Recommendation Engine (Phase 1.3.3.1)

Purpose:
- Provide a frontend-friendly recommendation plan for how to format content
- Uses existing read-only classifier results
- Does NOT store anything in the database
"""

from __future__ import annotations

from dataclasses import dataclass, asdict
from typing import Any, Dict

from backend.utils.content_classifier import classify_content


@dataclass
class FormatPlan:
    strategy: str
    chunk_size_hint: int
    notes: list[str]


def _normalize_text(text: str) -> str:
    """
    Light normalization ONLY:
    - normalize line endings
    - trim outer whitespace
    """
    return (text or "").replace("\r\n", "\n").strip()


def _make_first_chunk(text: str, max_chars: int) -> str:
    """
    Preview helper for UI
    """
    if not text:
        return ""
    return text[:max_chars]


def recommend_format(sample_text: str) -> Dict[str, Any]:
    """
    Read-only recommendation engine.

    Returns:
    - detected_type
    - recommended_format
    - confidence
    - plan (UI-readable)
    - preview (normalized_text + first chunk)
    """
    normalized = _normalize_text(sample_text)

    analysis = classify_content(normalized) or {}

    detected_type = analysis.get("detected_type", "unknown")
    recommended_format = analysis.get("recommended_format", "raw")
    confidence = float(analysis.get("confidence", 0.5))

    # Strategy mapping (stable + UI-friendly)
    if recommended_format == "heading_chunks":
        plan = FormatPlan(
            strategy="chunk_by_headings",
            chunk_size_hint=700,
            notes=[
                "Preserve headings as anchors",
                "Keep code fences intact",
                "Prefer 1-2 concepts per chunk",
            ],
        )
    elif recommended_format == "code_blocks":
        plan = FormatPlan(
            strategy="chunk_by_functions_and_classes",
            chunk_size_hint=900,
            notes=[
                "Keep each function/class together",
                "Include docstrings/comments with the code",
                "Avoid splitting mid-block",
            ],
        )
    elif recommended_format == "json_lines":
        plan = FormatPlan(
            strategy="normalize_to_jsonl_if_repeated_records",
            chunk_size_hint=1200,
            notes=[
                "If multiple records exist, prefer JSONL",
                "Keep schemas consistent",
                "Validate JSON before ingest",
            ],
        )
    else:
        plan = FormatPlan(
            strategy="minimal_cleanup_then_chunk_by_paragraph",
            chunk_size_hint=600,
            notes=[
                "Remove obvious noise only if needed",
                "Chunk by paragraphs",
                "Keep chunks self-contained",
            ],
        )

    first_chunk = _make_first_chunk(normalized, max_chars=min(plan.chunk_size_hint, 800))

    return {
        "detected_type": detected_type,
        "recommended_format": recommended_format,
        "confidence": confidence,
        "plan": asdict(plan),
        "preview": {
            "normalized_text": normalized,
            "first_chunk": first_chunk,
        },
    }
