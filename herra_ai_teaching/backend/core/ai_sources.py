"""
AI Source Registry (Phase 1.4.2 Option A)

This file provides a registry of AI platforms/sources.
Option A is a manual selector (no automatic detection yet).

The frontend will later use these endpoints to populate a dropdown.
"""

from typing import Dict, List


def get_supported_sources() -> List[Dict[str, str]]:
    # Keep keys stable; these keys are what we store in the DB.
    return [
        {"key": "mock", "label": "Mock / Local Adapter"},
        {"key": "openai", "label": "OpenAI (API)"},
        {"key": "azure_openai", "label": "Azure OpenAI"},
        {"key": "anthropic", "label": "Anthropic (Claude)"},
        {"key": "google_gemini", "label": "Google Gemini"},
        {"key": "local_llm", "label": "Local LLM (Ollama / LM Studio)"},
    ]


def is_valid_source(key: str) -> bool:
    k = (key or "").strip().lower()
    return any(s["key"] == k for s in get_supported_sources())
