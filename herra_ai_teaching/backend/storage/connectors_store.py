# backend/storage/connectors_store.py

from __future__ import annotations

from typing import Dict, List, Optional

from backend.storage.database import (
    get_connector_by_id,
    list_online_connectors,
    touch_connector,
    upsert_connector,
)


class PersistentConnectorsStore:
    """
    SQLite-backed connector registry.

    Current behavior:
    - reuses connector by logical name
    - heartbeat updates last_seen
    - online list survives backend restart
    """

    def register(self, name: str, os_name: str, meta: Optional[dict] = None) -> Dict[str, object]:
        return upsert_connector(name=name, os_name=os_name, meta=meta or {})

    def get(self, connector_id: str) -> Optional[Dict[str, object]]:
        return get_connector_by_id(connector_id)

    def heartbeat(self, connector_id: str) -> Optional[Dict[str, object]]:
        return touch_connector(connector_id)

    def list_online(self, online_within_seconds: int = 90) -> List[Dict[str, object]]:
        return list_online_connectors(online_within_seconds=online_within_seconds)


connectors_store = PersistentConnectorsStore()