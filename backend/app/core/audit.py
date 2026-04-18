from datetime import UTC, datetime
from typing import Any, Dict


def build_audit_event(
    actor_type: str,
    action: str,
    result: str,
    resource_type: str | None = None,
    resource_id: str | None = None,
    metadata: Dict[str, Any] | None = None,
) -> Dict[str, Any]:
    return {
        "actor_type": actor_type,
        "action": action,
        "result": result,
        "resource_type": resource_type,
        "resource_id": resource_id,
        "metadata": metadata or {},
        "created_at": datetime.now(UTC).isoformat(),
    }