# backend/storage/enrollment_store.py

from __future__ import annotations

from typing import List, Optional

from backend.storage.database import (
    create_bootstrap_token_record,
    get_bootstrap_token_record,
    list_bootstrap_token_records,
    mark_bootstrap_token_used,
)
from backend.storage.enrollment_models import EnrollmentToken, now_utc, parse_iso


class PersistentEnrollmentStore:
    """
    SQLite-backed bootstrap token store.

    Current behavior:
    - bootstrap tokens survive backend restart
    - use-once semantics remain enforced
    """

    def create(self, label: str, expires_minutes: int) -> EnrollmentToken:
        tok = EnrollmentToken.new(label=label, expires_minutes=expires_minutes)
        create_bootstrap_token_record(
            token_id=tok.id,
            token=tok.token,
            label=tok.label,
            created_at=tok.created_at,
            expires_at=tok.expires_at,
        )
        return tok

    def get_by_token(self, token_value: str) -> Optional[EnrollmentToken]:
        row = get_bootstrap_token_record(token_value)
        if row is None:
            return None

        return EnrollmentToken(
            id=str(row["id"]),
            token=str(row["token"]),
            label=str(row["label"]),
            created_at=str(row["created_at"]),
            expires_at=str(row["expires_at"]),
            used=bool(row["used"]),
            used_at=row["used_at"],
            used_by_name=row["used_by_name"],
        )

    def use_token(self, token_value: str, connector_name: str) -> EnrollmentToken:
        tok = self.get_by_token(token_value)
        if tok is None:
            raise ValueError("Bootstrap token not found.")
        if tok.used:
            raise ValueError("Bootstrap token already used.")
        if tok.is_expired():
            raise ValueError("Bootstrap token expired.")

        used_at = now_utc()
        changed = mark_bootstrap_token_used(token_value, connector_name, used_at=used_at)
        if not changed:
            raise ValueError("Bootstrap token already used.")

        tok2 = self.get_by_token(token_value)
        if tok2 is None:
            raise ValueError("Bootstrap token not found.")
        return tok2

    def list_tokens(self) -> List[EnrollmentToken]:
        rows = list_bootstrap_token_records()
        out: List[EnrollmentToken] = []

        for row in rows:
            out.append(
                EnrollmentToken(
                    id=str(row["id"]),
                    token=str(row["token"]),
                    label=str(row["label"]),
                    created_at=str(row["created_at"]),
                    expires_at=str(row["expires_at"]),
                    used=bool(row["used"]),
                    used_at=row["used_at"],
                    used_by_name=row["used_by_name"],
                )
            )

        return out


enrollment_store = PersistentEnrollmentStore()