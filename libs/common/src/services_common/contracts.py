import hashlib
import os
import re
import uuid
from datetime import datetime, timezone
from email import policy
from email.parser import BytesParser
from typing import Any


DEFAULT_TENANT = os.getenv("TENANT_ID", "demo")
MAIL_SOURCE = "mail.security.ingest"
MAIL_DETAIL_TYPE = "MailReceived"


def now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def stable_message_id(raw_bytes: bytes, prefix: str | None = None) -> str:
    digest = hashlib.sha256(raw_bytes).hexdigest()[:16]
    if prefix:
        return f"{prefix}-{digest}"
    return f"{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}-{digest}"


def safe_filename(name: str) -> str:
    cleaned = re.sub(r"[^A-Za-z0-9._-]+", "-", name or "attachment.bin").strip(".-")
    return cleaned or "attachment.bin"


def extract_header_hints(raw_bytes: bytes, to_override: list[str] | None = None, from_override: str | None = None) -> dict[str, Any]:
    msg = BytesParser(policy=policy.default).parsebytes(raw_bytes)
    tos = msg.get_all("to", []) or []
    ccs = msg.get_all("cc", []) or []
    return {
        "from": from_override or str(msg.get("from", "")),
        "to": to_override or [str(v) for v in tos],
        "cc": [str(v) for v in ccs],
        "subject": str(msg.get("subject", "")),
    }


def make_mail_received_event(
    *,
    raw_bytes: bytes,
    raw_bucket: str,
    raw_key: str,
    recipients: list[str],
    mail_from: str | None = None,
    tenant_id: str = DEFAULT_TENANT,
    message_id: str | None = None,
    source: str = "local-seed",
) -> dict[str, Any]:
    headers = extract_header_hints(raw_bytes, to_override=recipients, from_override=mail_from)
    mid = message_id or stable_message_id(raw_bytes)
    detail = {
        "tenantId": tenant_id,
        "messageId": mid,
        "receivedAt": now_iso(),
        "source": source,
        "raw": {"bucket": raw_bucket, "key": raw_key},
        "envelope": {
            "mailFrom": mail_from or headers.get("from", ""),
            "recipients": recipients,
        },
        "headers": headers,
        "sesVerdicts": {
            "spamVerdict": "UNKNOWN",
            "virusVerdict": "UNKNOWN",
            "spfVerdict": "UNKNOWN",
            "dkimVerdict": "UNKNOWN",
            "dmarcVerdict": "UNKNOWN",
        },
    }
    return {"source": MAIL_SOURCE, "detail-type": MAIL_DETAIL_TYPE, "detail": detail}


def detail_from_event(event: dict[str, Any]) -> dict[str, Any]:
    if "detail" in event and isinstance(event["detail"], dict):
        return event["detail"]
    return event


def ensure_artifacts(detail: dict[str, Any]) -> dict[str, Any]:
    detail.setdefault("artifacts", {})
    return detail


def attachment_id(index: int, filename: str, payload: bytes) -> str:
    return f"{index:03d}-{hashlib.sha256(payload).hexdigest()[:16]}-{safe_filename(filename)}"


def new_execution_name(message_id: str) -> str:
    suffix = uuid.uuid4().hex[:8]
    return safe_filename(f"{message_id}-{suffix}")[:80]
