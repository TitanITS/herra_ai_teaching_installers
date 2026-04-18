# backend/storage/connectors_models.py

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, Optional
import uuid


def now_utc() -> str:
    return datetime.now(timezone.utc).isoformat()


@dataclass
class Connector:
    id: str
    name: str
    os: str
    created_at: str
    last_seen: str
    meta: Dict[str, Any] = field(default_factory=dict)

    @staticmethod
    def new(name: str, os_name: str, meta: Optional[Dict[str, Any]] = None) -> "Connector":
        t = now_utc()
        return Connector(
            id=str(uuid.uuid4()),
            name=name.strip(),
            os=os_name.strip(),
            created_at=t,
            last_seen=t,
            meta=meta or {},
        )

    def touch(self) -> None:
        self.last_seen = now_utc()

    def update_meta(self, meta: Optional[Dict[str, Any]] = None) -> None:
        if isinstance(meta, dict):
            self.meta = dict(meta)
        self.last_seen = now_utc()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "os": self.os,
            "created_at": self.created_at,
            "last_seen": self.last_seen,
            "meta": self.meta,
        }