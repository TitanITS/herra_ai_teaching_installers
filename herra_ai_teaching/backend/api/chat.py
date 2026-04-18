from __future__ import annotations

import os
from typing import Any, Dict, List, Optional

import requests
from fastapi import APIRouter, Request
from pydantic import BaseModel, Field

from backend.api.contracts import ApiError, get_request_id, ok
from backend.api.dependencies import ApiKeyDep
from backend.storage.database import get_active_ai_source, get_ai_runtime_profile
from backend.storage.chat_store import count_ingested_text, search_ingested_text_context

router = APIRouter(prefix="/chat", tags=["chat"])

_OPENAI_CHAT_COMPLETIONS_URL = "https://api.openai.com/v1/chat/completions"
_SUPPORTED_OPENAI_MODELS = {"gpt-4o", "gpt-4o-mini", "gpt-4.1"}


class ChatMessageIn(BaseModel):
    role: str
    content: str = Field(min_length=1, max_length=8000)


class ChatSendIn(BaseModel):
    message: str = Field(min_length=1, max_length=8000)
    history: List[ChatMessageIn] = Field(default_factory=list)
    use_context: bool = True


def _normalize_role(value: str) -> str:
    role = (value or "").strip().lower()
    if role in {"assistant", "system"}:
        return role
    return "user"


def _truncate(text: str, max_chars: int) -> str:
    cleaned = (text or "").strip()
    if len(cleaned) <= max_chars:
        return cleaned
    return cleaned[: max_chars - 3].rstrip() + "..."


def _build_context_snippets(message: str, use_context: bool) -> List[Dict[str, Any]]:
    if not use_context:
        return []
    return search_ingested_text_context(message, limit=4)


def _build_system_prompt(context_items: List[Dict[str, Any]]) -> str:
    base = (
        "You are the Herra AI Teaching assistant. "
        "Answer clearly, concisely, and truthfully. "
        "When context is supplied from ingested platform content, ground your answer in that context and do not invent facts. "
        "If the context is insufficient, say what is missing."
    )

    if not context_items:
        return base + " No ingested context snippets were selected for this request."

    rendered_context: List[str] = []
    for item in context_items:
        rendered_context.append(
            f"[Entry #{item['id']}]\n{_truncate(item['text'], 1200)}"
        )

    return base + "\n\nRelevant ingested context:\n\n" + "\n\n".join(rendered_context)


def _local_fallback_reply(
    *,
    user_message: str,
    active_source: str,
    runtime_profile: Dict[str, Any],
    context_items: List[Dict[str, Any]],
    warning: Optional[str] = None,
) -> str:
    lines: List[str] = []

    if warning:
        lines.append(warning)
        lines.append("")

    if context_items:
        lines.append("I used the currently ingested Herra context to build a local fallback answer.")
        lines.append("")
        lines.append("Most relevant ingested notes:")
        for item in context_items:
            lines.append(f"- Entry #{item['id']}: {_truncate(item['text'], 220)}")
        lines.append("")
        lines.append("Based on that context, here is the safest current response:")
        lines.append(
            "The platform contains related ingested content, but this chat is currently operating in local fallback mode rather than a live external model response. "
            "Use the snippets above as the primary grounded context for this question."
        )
    else:
        lines.append(
            "I do not have enough matching ingested context to answer that confidently from the local Herra store alone."
        )
        lines.append(
            "You can still continue the conversation, but a stronger answer will require either more ingested source material or a configured live AI provider."
        )

    lines.append("")
    lines.append(f"Your latest message was: \"{_truncate(user_message, 300)}\"")
    lines.append(
        f"Active source: {active_source} | Runtime mode: {runtime_profile.get('mode', 'unknown')} | Model: {runtime_profile.get('model_key') or 'not set'}"
    )

    return "\n".join(lines).strip()


def _call_openai_chat(
    *,
    api_key: str,
    model: str,
    system_prompt: str,
    history: List[ChatMessageIn],
    user_message: str,
) -> str:
    messages: List[Dict[str, str]] = [{"role": "system", "content": system_prompt}]

    for item in history[-10:]:
        messages.append(
            {
                "role": _normalize_role(item.role),
                "content": _truncate(item.content, 4000),
            }
        )

    messages.append({"role": "user", "content": user_message})

    response = requests.post(
        _OPENAI_CHAT_COMPLETIONS_URL,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        json={
            "model": model,
            "messages": messages,
            "temperature": 0.2,
            "max_tokens": 700,
        },
        timeout=60,
    )

    try:
        payload = response.json()
    except Exception as exc:  # pragma: no cover - defensive
        raise ApiError(
            "UPSTREAM_ERROR",
            "OpenAI returned a non-JSON response",
            502,
            {"status_code": response.status_code, "exception": str(exc)},
        )

    if response.status_code >= 400:
        message = "OpenAI request failed"
        if isinstance(payload, dict):
            message = (
                payload.get("error", {}).get("message")
                or payload.get("message")
                or message
            )
        raise ApiError(
            "UPSTREAM_ERROR",
            message,
            502,
            {"status_code": response.status_code, "provider": "openai"},
        )

    choices = payload.get("choices") or []
    if not choices:
        raise ApiError("UPSTREAM_ERROR", "OpenAI returned no choices", 502, {"provider": "openai"})

    content = choices[0].get("message", {}).get("content", "")
    if not content:
        raise ApiError("UPSTREAM_ERROR", "OpenAI returned an empty assistant message", 502, {"provider": "openai"})

    return content.strip()


@router.get("/status", dependencies=[ApiKeyDep])
def chat_status(request: Request):
    rid = get_request_id(request)

    active_source = get_active_ai_source()
    runtime_profile = get_ai_runtime_profile()
    api_key_present = bool((os.getenv("OPENAI_API_KEY") or "").strip())
    ingested_entries = count_ingested_text()

    source_ready = False
    readiness_reason = ""

    if active_source == "openai":
        if api_key_present:
            source_ready = True
            readiness_reason = "OpenAI source is selected and OPENAI_API_KEY is present."
        else:
            readiness_reason = "OpenAI source is selected, but OPENAI_API_KEY is not configured. Local fallback mode will be used."
    elif active_source == "mock":
        source_ready = True
        readiness_reason = "Mock/local fallback chat is available without external API usage."
    else:
        readiness_reason = f"{active_source} is selected, but live provider wiring is not implemented yet. Local fallback mode will be used."

    return ok(
        rid,
        {
            "active_source": active_source,
            "runtime_profile": runtime_profile,
            "api_key_present": api_key_present,
            "provider_ready": source_ready,
            "readiness_reason": readiness_reason,
            "ingested_entry_count": ingested_entries,
        },
    )


@router.post("/message", dependencies=[ApiKeyDep])
def send_chat_message(payload: ChatSendIn, request: Request):
    rid = get_request_id(request)

    user_message = (payload.message or "").strip()
    if not user_message:
        raise ApiError("VALIDATION_ERROR", "message is required", 400, {"fields": {"message": "Required"}})

    active_source = get_active_ai_source()
    runtime_profile = get_ai_runtime_profile()
    context_items = _build_context_snippets(user_message, payload.use_context)

    provider_used = "local_fallback"
    warning: Optional[str] = None
    assistant_text: str

    if active_source == "openai":
        api_key = (os.getenv("OPENAI_API_KEY") or "").strip()
        model = (runtime_profile.get("model_key") or "gpt-4o-mini").strip()
        if model not in _SUPPORTED_OPENAI_MODELS:
            model = "gpt-4o-mini"

        if api_key:
            try:
                assistant_text = _call_openai_chat(
                    api_key=api_key,
                    model=model,
                    system_prompt=_build_system_prompt(context_items),
                    history=payload.history,
                    user_message=user_message,
                )
                provider_used = "openai"
            except ApiError as exc:
                warning = (
                    f"Live OpenAI chat was unavailable ({exc.message}). "
                    "A local fallback answer was returned instead."
                )
                assistant_text = _local_fallback_reply(
                    user_message=user_message,
                    active_source=active_source,
                    runtime_profile=runtime_profile,
                    context_items=context_items,
                    warning=warning,
                )
        else:
            warning = (
                "OpenAI is the active source, but OPENAI_API_KEY is not configured on the backend. "
                "A local fallback answer was returned instead."
            )
            assistant_text = _local_fallback_reply(
                user_message=user_message,
                active_source=active_source,
                runtime_profile=runtime_profile,
                context_items=context_items,
                warning=warning,
            )
    elif active_source == "mock":
        assistant_text = _local_fallback_reply(
            user_message=user_message,
            active_source=active_source,
            runtime_profile=runtime_profile,
            context_items=context_items,
            warning="Mock / Local Adapter is the active source, so this response was generated locally.",
        )
    else:
        warning = (
            f"{active_source} is selected, but live chat wiring for that provider is not implemented yet. "
            "A local fallback answer was returned instead."
        )
        assistant_text = _local_fallback_reply(
            user_message=user_message,
            active_source=active_source,
            runtime_profile=runtime_profile,
            context_items=context_items,
            warning=warning,
        )

    citations = [
        {
            "entry_id": item["id"],
            "created_at": item.get("created_at"),
            "preview": _truncate(item.get("text", ""), 180),
        }
        for item in context_items
    ]

    return ok(
        rid,
        {
            "assistant_message": {
                "role": "assistant",
                "content": assistant_text,
            },
            "active_source": active_source,
            "provider_used": provider_used,
            "warning": warning,
            "citations": citations,
            "ingested_context_count": len(citations),
        },
    )