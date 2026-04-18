# backend/storage/enrollment_models.py

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Dict, Optional
import secrets
import uuid


def now_utc() -> str:
    return datetime.now(timezone.utc).isoformat()


def parse_iso(ts: str) -> datetime:
    return datetime.fromisoformat(ts)


@dataclass
class EnrollmentToken:
    id: str
    token: str
    label: str
    created_at: str
    expires_at: str
    used: bool
    used_at: Optional[str]
    used_by_name: Optional[str]

    @staticmethod
    def new(label: str, expires_minutes: int) -> "EnrollmentToken":
        created = datetime.now(timezone.utc)
        expires = created + timedelta(minutes=max(1, expires_minutes))
        return EnrollmentToken(
            id=str(uuid.uuid4()),
            token=secrets.token_urlsafe(24),
            label=label.strip() or "connector-bootstrap",
            created_at=created.isoformat(),
            expires_at=expires.isoformat(),
            used=False,
            used_at=None,
            used_by_name=None,
        )

    def is_expired(self) -> bool:
        return datetime.now(timezone.utc) > parse_iso(self.expires_at)

    def mark_used(self, connector_name: str) -> None:
        self.used = True
        self.used_at = now_utc()
        self.used_by_name = connector_name.strip()

    def to_dict(self, include_secret: bool = False) -> Dict[str, object]:
        data: Dict[str, object] = {
            "id": self.id,
            "label": self.label,
            "created_at": self.created_at,
            "expires_at": self.expires_at,
            "used": self.used,
            "used_at": self.used_at,
            "used_by_name": self.used_by_name,
        }
        if include_secret:
            data["token"] = self.token
        return data