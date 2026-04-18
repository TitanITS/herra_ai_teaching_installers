from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
import os


@dataclass(frozen=True)
class Settings:
    # Comma-separated list of allowed scan roots (absolute paths).
    # Example:
    #   HERRA_SCAN_ROOTS=C:\Titan Information Technology Solutions\herra_ai_teaching
    scan_roots: list[Path]

    # Safety defaults
    scan_max_files_default: int = 500
    scan_max_depth_default: int = 25


def _parse_scan_roots(raw: str | None) -> list[Path]:
    roots: list[Path] = []
    if raw:
        for part in raw.split(","):
            p = part.strip().strip('"').strip("'")
            if not p:
                continue
            roots.append(Path(p).expanduser().resolve())

    # If env var not set, default to repo root inferred from this file location:
    # .../backend/core/settings.py -> repo root is 3 levels up
    if not roots:
        repo_root = Path(__file__).resolve().parents[2]
        roots = [repo_root]

    return roots


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    raw = os.getenv("HERRA_SCAN_ROOTS")
    roots = _parse_scan_roots(raw)
    return Settings(scan_roots=roots)
