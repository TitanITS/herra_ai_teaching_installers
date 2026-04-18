# backend/utils/content_classifier.py

import re
from typing import Dict


def classify_content(text: str) -> Dict[str, object]:
    """
    Read-only heuristic classification.
    No mutation, no DB access, no side effects.
    """

    if not text or not text.strip():
        return {
            "detected_type": "empty",
            "recommended_format": "none",
            "confidence": 1.0
        }

    # Heuristics
    code_patterns = [
        r"def\s+\w+\(",
        r"class\s+\w+",
        r"{\s*\".*\":",
        r";\s*$",
        r"#include\s+<",
    ]

    markdown_patterns = [
        r"^#{1,6}\s+",
        r"\*\*.+\*\*",
        r"\[.+\]\(.+\)",
        r"```"
    ]

    structured_patterns = [
        r"^\s*{.*}\s*$",
        r"^\s*\[.*\]\s*$"
    ]

    lines = text.splitlines()

    code_hits = sum(bool(re.search(p, text, re.MULTILINE)) for p in code_patterns)
    markdown_hits = sum(bool(re.search(p, text, re.MULTILINE)) for p in markdown_patterns)
    structured_hits = sum(bool(re.search(p, text, re.MULTILINE)) for p in structured_patterns)

    if code_hits >= 2:
        return {
            "detected_type": "code",
            "recommended_format": "code_blocks",
            "confidence": 0.9
        }

    if markdown_hits >= 2:
        return {
            "detected_type": "markdown",
            "recommended_format": "heading_chunks",
            "confidence": 0.9
        }

    if structured_hits >= 1:
        return {
            "detected_type": "structured_data",
            "recommended_format": "schema_preserving",
            "confidence": 0.85
        }

    if len(lines) > 3:
        return {
            "detected_type": "plain_text",
            "recommended_format": "semantic_chunks",
            "confidence": 0.75
        }

    return {
        "detected_type": "unknown",
        "recommended_format": "raw",
        "confidence": 0.5
    }
