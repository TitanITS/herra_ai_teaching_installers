from __future__ import annotations

from fastapi import APIRouter, Request
from pydantic import BaseModel
from typing import Any, Dict, List, Optional

from pathlib import Path
import fnmatch

from backend.api.contracts import ok, ApiError, get_request_id
from backend.api.file_ingest import (
    prepare_file as _prepare_file,
    ingest_file as _ingest_file,
    prepare_files as _prepare_files,
    ingest_files as _ingest_files,
    format_analysis as _format_analysis,
)
from backend.core.settings import get_settings
from backend.api.schemas.envelope import ApiResponse
from backend.storage.database import (
    fetch_audit_log,
    fetch_confidence,
    fetch_trust,
    get_active_ai_source,
    set_active_ai_source,
    get_ai_runtime_profile,
    set_ai_runtime_profile,
)
from backend.core.format_recommendation import recommend_format

router = APIRouter(prefix="/system", tags=["system"])


# =========================================================
# MODELS
# =========================================================
class FormatAnalysisIn(BaseModel):
    sample_text: str


class FormatRecommendationIn(BaseModel):
    sample_text: str


class FilePathIn(BaseModel):
    path: str
    max_chars: int = 5000


class MultiFileIn(BaseModel):
    paths: List[str]
    max_chars: int = 5000


class MultiFileIngestIn(BaseModel):
    paths: List[str]
    max_chars: Optional[int] = None


class FileIngestIn(BaseModel):
    path: str
    max_chars: Optional[int] = None


class SetAiSourceIn(BaseModel):
    source_key: str


class SetAiRuntimeProfileIn(BaseModel):
    mode: str
    provider_key: Optional[str] = None
    model_key: Optional[str] = None
    notes: Optional[str] = ""


class ScanFilesIn(BaseModel):
    root: Optional[str] = None
    root_path: Optional[str] = None
    include: Optional[List[str]] = None
    include_globs: Optional[List[str]] = None
    exclude: Optional[List[str]] = None
    exclude_globs: Optional[List[str]] = None
    max_files: Optional[int] = None
    max_depth: Optional[int] = None

    model_config = {"extra": "allow"}


# =========================================================
# STATIC MODEL CATALOG (Step 5A scaffolding)
# =========================================================
_AI_MODEL_CATALOG = [
    {
        "provider_key": "openai",
        "provider_label": "OpenAI",
        "models": [
            {"model_key": "gpt-4o", "model_label": "GPT-4o"},
            {"model_key": "gpt-4o-mini", "model_label": "GPT-4o Mini"},
            {"model_key": "gpt-4.1", "model_label": "GPT-4.1"},
        ],
    },
    {
        "provider_key": "azure_openai",
        "provider_label": "Azure OpenAI",
        "models": [
            {"model_key": "azure-gpt-4o", "model_label": "Azure GPT-4o"},
            {"model_key": "azure-gpt-4o-mini", "model_label": "Azure GPT-4o Mini"},
        ],
    },
    {
        "provider_key": "anthropic",
        "provider_label": "Anthropic",
        "models": [
            {"model_key": "claude-3.5-sonnet", "model_label": "Claude 3.5 Sonnet"},
            {"model_key": "claude-3.7-sonnet", "model_label": "Claude 3.7 Sonnet"},
        ],
    },
    {
        "provider_key": "google_gemini",
        "provider_label": "Google Gemini",
        "models": [
            {"model_key": "gemini-1.5-pro", "model_label": "Gemini 1.5 Pro"},
            {"model_key": "gemini-1.5-flash", "model_label": "Gemini 1.5 Flash"},
        ],
    },
    {
        "provider_key": "local_llm",
        "provider_label": "Local LLM",
        "models": [
            {"model_key": "ollama-llama3", "model_label": "Ollama Llama 3"},
            {"model_key": "lmstudio-local", "model_label": "LM Studio Local"},
        ],
    },
]


# =========================================================
# META / AUDIT / TRUST / CONFIDENCE
# =========================================================
@router.get("/meta", response_model=ApiResponse[Dict[str, Any]])
def system_meta(request: Request):
    rid = get_request_id(request)
    settings = get_settings()

    data = {
        "app_name": "Herra AI Teaching API",
        "app_version": "1.0.0",
        "env": "local",
        "features": {
            "docs": True,
            "health": True,
            "connector_jobs": True,
            "ai_runtime_profile": True,
        },
        "cors_allow_origins": ["http://localhost:5173", "http://127.0.0.1:5173"],
        "scan_roots": [str(p) for p in getattr(settings, "scan_roots", [])],
    }
    return ok(rid, data)


@router.get("/audit", response_model=ApiResponse[Dict[str, Any]])
def system_audit(request: Request):
    rid = get_request_id(request)
    return ok(rid, {"entries": fetch_audit_log()})


@router.get("/trust", response_model=ApiResponse[Dict[str, Any]])
def system_trust(request: Request):
    rid = get_request_id(request)
    return ok(rid, fetch_trust())


@router.get("/confidence", response_model=ApiResponse[Dict[str, Any]])
def system_confidence(request: Request):
    rid = get_request_id(request)
    return ok(rid, fetch_confidence())


# =========================================================
# FORMAT / ANALYSIS
# =========================================================
@router.post("/format-analysis", response_model=ApiResponse[Dict[str, Any]])
def system_format_analysis(payload: FormatAnalysisIn, request: Request):
    rid = get_request_id(request)
    try:
        return ok(rid, _format_analysis(payload.sample_text))
    except Exception as e:
        raise ApiError("INTERNAL_ERROR", "Failed to analyze format", 500, {"exception": str(e)})


@router.post("/format-recommendation", response_model=ApiResponse[Dict[str, Any]])
def system_format_recommendation(payload: FormatRecommendationIn, request: Request):
    rid = get_request_id(request)
    try:
        return ok(rid, recommend_format(payload.sample_text))
    except Exception as e:
        raise ApiError("INTERNAL_ERROR", "Failed to recommend format", 500, {"exception": str(e)})


# =========================================================
# AI SOURCES / MODEL PROFILE
# =========================================================
_SOURCES = [
    {"key": "mock", "label": "Mock / Local Adapter"},
    {"key": "openai", "label": "OpenAI (API)"},
    {"key": "azure_openai", "label": "Azure OpenAI"},
    {"key": "anthropic", "label": "Anthropic (Claude)"},
    {"key": "google_gemini", "label": "Google Gemini"},
    {"key": "local_llm", "label": "Local LLM (Ollama / LM Studio)"},
]


@router.get("/ai-sources", response_model=ApiResponse[Dict[str, Any]])
def list_ai_sources(request: Request):
    rid = get_request_id(request)
    return ok(rid, {"sources": _SOURCES})


@router.get("/ai-source", response_model=ApiResponse[Dict[str, Any]])
def get_ai_source(request: Request):
    rid = get_request_id(request)
    return ok(rid, {"active_source": get_active_ai_source()})


@router.post("/ai-source", response_model=ApiResponse[Dict[str, Any]])
def set_ai_source(payload: SetAiSourceIn, request: Request):
    rid = get_request_id(request)

    key = (payload.source_key or "").strip()
    if not key:
        raise ApiError("VALIDATION_ERROR", "source_key is required", 400, {"fields": {"source_key": "Required"}})

    allowed = {s["key"] for s in _SOURCES}
    if key not in allowed:
        raise ApiError("VALIDATION_ERROR", f"Unknown source_key '{key}'", 400, {"allowed": sorted(list(allowed))})

    set_active_ai_source(key)
    return ok(rid, {"active_source": key, "status": "updated"})


@router.get("/ai-models", response_model=ApiResponse[Dict[str, Any]])
def list_ai_models(request: Request):
    rid = get_request_id(request)
    return ok(rid, {"providers": _AI_MODEL_CATALOG})


@router.get("/ai-runtime-profile", response_model=ApiResponse[Dict[str, Any]])
def get_runtime_profile(request: Request):
    rid = get_request_id(request)
    return ok(rid, {"profile": get_ai_runtime_profile()})


@router.post("/ai-runtime-profile", response_model=ApiResponse[Dict[str, Any]])
def set_runtime_profile(payload: SetAiRuntimeProfileIn, request: Request):
    rid = get_request_id(request)

    mode = (payload.mode or "").strip().lower()
    if mode not in {"manual", "autodetect"}:
        raise ApiError("VALIDATION_ERROR", "mode must be 'manual' or 'autodetect'", 400, {"mode": payload.mode})

    provider_key = (payload.provider_key or "").strip() or None
    model_key = (payload.model_key or "").strip() or None
    notes = (payload.notes or "").strip()

    if mode == "manual":
        if not provider_key:
            raise ApiError("VALIDATION_ERROR", "provider_key is required in manual mode", 400, {"provider_key": "Required"})
        if not model_key:
            raise ApiError("VALIDATION_ERROR", "model_key is required in manual mode", 400, {"model_key": "Required"})

        valid_provider = False
        valid_model = False

        for p in _AI_MODEL_CATALOG:
            if p["provider_key"] == provider_key:
                valid_provider = True
                for m in p["models"]:
                    if m["model_key"] == model_key:
                        valid_model = True
                        break
                break

        if not valid_provider:
            raise ApiError("VALIDATION_ERROR", "Unknown provider_key", 400, {"provider_key": provider_key})
        if not valid_model:
            raise ApiError("VALIDATION_ERROR", "Unknown model_key for provider", 400, {"model_key": model_key})

    if mode == "autodetect":
        provider_key = None
        model_key = None

    profile = set_ai_runtime_profile(
        mode=mode,
        provider_key=provider_key,
        model_key=model_key,
        notes=notes,
    )

    return ok(rid, {"profile": profile, "status": "updated"})


# =========================================================
# FILE PREP + INGEST
# =========================================================
@router.post("/file/prepare", response_model=ApiResponse[Dict[str, Any]])
def prepare_file(payload: FilePathIn, request: Request):
    rid = get_request_id(request)
    try:
        return ok(rid, _prepare_file(payload.path, max_chars=int(payload.max_chars)))
    except Exception as e:
        raise ApiError("INTERNAL_ERROR", "Failed to prepare file", 500, {"exception": str(e)})


@router.post("/file/ingest", response_model=ApiResponse[Dict[str, Any]])
def ingest_file(payload: FileIngestIn, request: Request):
    rid = get_request_id(request)
    try:
        return ok(rid, _ingest_file(payload.path, max_chars=payload.max_chars))
    except Exception as e:
        raise ApiError("INTERNAL_ERROR", "Failed to ingest file", 500, {"exception": str(e)})


@router.post("/files/prepare", response_model=ApiResponse[Dict[str, Any]])
def prepare_files(payload: MultiFileIn, request: Request):
    rid = get_request_id(request)
    try:
        return ok(rid, _prepare_files(payload.paths, max_chars=int(payload.max_chars)))
    except Exception as e:
        raise ApiError("INTERNAL_ERROR", "Failed to prepare files", 500, {"exception": str(e)})


@router.post("/files/ingest", response_model=ApiResponse[Dict[str, Any]])
def ingest_files(payload: MultiFileIngestIn, request: Request):
    rid = get_request_id(request)
    try:
        return ok(rid, _ingest_files(payload.paths, max_chars=payload.max_chars))
    except Exception as e:
        raise ApiError("INTERNAL_ERROR", "Failed to ingest files", 500, {"exception": str(e)})


# =========================================================
# SCAN HELPERS
# =========================================================
def _is_under_allowed_roots(candidate: Path, roots: List[Path]) -> bool:
    c = candidate.resolve()
    for r in roots:
        try:
            c.relative_to(r.resolve())
            return True
        except Exception:
            continue
    return False


def _match_any(path_str: str, patterns: List[str]) -> bool:
    s = path_str.replace("\\", "/")
    for pat in patterns:
        p = pat.replace("\\", "/")
        if fnmatch.fnmatch(s, p) or fnmatch.fnmatch(Path(s).name, p):
            return True
    return False


# =========================================================
# FILE SCAN (local compatibility path)
# =========================================================
@router.post("/files/scan", response_model=ApiResponse[Dict[str, Any]])
def scan_files(payload: ScanFilesIn, request: Request):
    rid = get_request_id(request)
    try:
        settings = get_settings()

        root_value = payload.root_path or payload.root
        root_str = (root_value or "").strip()
        if not root_str:
            raise ApiError(
                "VALIDATION_ERROR",
                "root_path (or root) is required",
                400,
                {"fields": {"root_path": "Required"}},
            )

        root = Path(root_str)
        scan_roots = getattr(settings, "scan_roots", None)
        allowed_roots: List[Path] = [Path(p) for p in scan_roots] if isinstance(scan_roots, list) and scan_roots else [root]

        if not _is_under_allowed_roots(root, allowed_roots):
            raise ApiError(
                "FORBIDDEN",
                "Root path is not within allowed scan roots",
                403,
                {"root_path": str(root), "allowed_roots": [str(r) for r in allowed_roots]},
            )

        include_value = payload.include_globs or payload.include
        exclude_value = payload.exclude_globs or payload.exclude

        include = include_value if include_value else ["**/*"]
        exclude = exclude_value if exclude_value else []

        max_files = int(payload.max_files) if payload.max_files else 5000
        max_files = max(1, min(max_files, 20000))

        max_depth = int(payload.max_depth) if payload.max_depth else 25
        max_depth = max(0, min(max_depth, 200))

        if not root.exists():
            raise ApiError("NOT_FOUND", "Root path does not exist", 404, {"root_path": str(root)})
        if not root.is_dir():
            raise ApiError("VALIDATION_ERROR", "Root path must be a folder", 400, {"root_path": str(root)})

        root_parts = len(root.resolve().parts)
        files: List[Dict[str, Any]] = []

        for p in root.rglob("*"):
            if len(files) >= max_files:
                break
            if not p.is_file():
                continue

            try:
                depth = len(p.resolve().parts) - root_parts
            except Exception:
                depth = 0

            if depth > max_depth:
                continue

            rel = str(p.relative_to(root))
            rel_norm = rel.replace("\\", "/")

            if exclude and _match_any(rel_norm, exclude):
                continue

            if include and include != ["**/*"] and not _match_any(rel_norm, include):
                continue

            try:
                size = p.stat().st_size
            except Exception:
                size = None

            files.append({"path": str(p), "relative_path": rel_norm, "size_bytes": size})

        return ok(
            rid,
            {
                "root_path": str(root),
                "allowed_roots": [str(r) for r in allowed_roots],
                "include_globs": include,
                "exclude_globs": exclude,
                "max_files": max_files,
                "max_depth": max_depth,
                "files_found": len(files),
                "files": files,
            },
        )

    except ApiError:
        raise
    except Exception as e:
        raise ApiError("INTERNAL_ERROR", "Failed to scan files", 500, {"exception": str(e)})


@router.post("/folder/scan", response_model=ApiResponse[Dict[str, Any]])
def scan_folder(payload: ScanFilesIn, request: Request):
    return scan_files(payload, request)