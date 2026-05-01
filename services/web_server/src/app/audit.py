from datetime import datetime, timezone
import logging
from typing import Any
from uuid import uuid4

from services_common.aws_helper import get_table


logger = logging.getLogger(__name__)


def now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def write_audit(
    *,
    actor: dict[str, Any] | None,
    action: str,
    message_id: str | None = None,
    metadata: dict[str, Any] | None = None,
    tenant_id: str | None = None,
) -> None:
    timestamp = now_iso()
    actor = actor or {}
    tenant = tenant_id or actor.get("tenantId") or "demo"
    item = {
        "tenantId": tenant,
        "sortKey": f"{timestamp}#{uuid4().hex[:10]}",
        "eventId": uuid4().hex,
        "timestamp": timestamp,
        "actorUserId": actor.get("sub") or actor.get("userId") or "anonymous",
        "actorEmail": actor.get("email", "anonymous"),
        "actorRole": actor.get("role", "unknown"),
        "action": action,
        "messageId": message_id or "",
        "metadata": metadata or {},
    }
    try:
        get_table("AUDIT_TABLE").put_item(Item=item)
    except Exception:
        # Audit should never break core demo flows when the local table has not
        # been created yet; the admin audit endpoint will surface table issues.
        logger.exception("audit_write_failed", extra={"audit_action": action, "message_id": message_id})
