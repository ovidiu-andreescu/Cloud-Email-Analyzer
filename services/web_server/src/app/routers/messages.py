from decimal import Decimal
from collections import Counter, defaultdict
from datetime import datetime, timezone
import json
import logging
import os
import re
from typing import Any, Optional
from urllib.parse import quote, urlparse

from boto3.dynamodb.conditions import Key
from fastapi import APIRouter, Depends, HTTPException, Response

from services_common.aws_helper import get_table, s3_read, s3_read_json, stepfunctions_client
from services_common.contracts import new_execution_name
from ..audit import write_audit
from ..auth import current_user, is_admin, public_user


router = APIRouter(tags=["messages"])
logger = logging.getLogger(__name__)

STATUS_ORDER = [
    "RECEIVED",
    "RECIPIENTS_RESOLVED",
    "PARSED",
    "ML_SCANNED",
    "ATTACHMENTS_SCANNED",
    "COMPLETE",
    "PARTIAL",
    "FAILED",
    "QUARANTINED",
]
STEP_LABELS = [
    ("received", "Received"),
    ("recipients", "Recipients resolved"),
    ("parsed", "Parsed"),
    ("ml", "ML scanned"),
    ("attachments", "Attachments scanned"),
    ("complete", "Complete"),
]
URL_RE = re.compile(r"https?://[^\s<>'\")]+", re.IGNORECASE)
DOMAIN_RE = re.compile(r"\b(?:[a-z0-9-]+\.)+[a-z]{2,}\b", re.IGNORECASE)


def _jsonable(value):
    if isinstance(value, Decimal):
        return float(value)
    if isinstance(value, list):
        return [_jsonable(v) for v in value]
    if isinstance(value, dict):
        return {k: _jsonable(v) for k, v in value.items()}
    return value


def _scan_all(table_name: str) -> list[dict[str, Any]]:
    table = get_table(table_name)
    response = table.scan()
    items = response.get("Items", [])
    while response.get("LastEvaluatedKey"):
        response = table.scan(ExclusiveStartKey=response["LastEvaluatedKey"])
        items.extend(response.get("Items", []))
    return items


def _query_all(table, **kwargs) -> list[dict[str, Any]]:
    response = table.query(**kwargs)
    items = response.get("Items", [])
    while response.get("LastEvaluatedKey"):
        response = table.query(
            **{**kwargs, "ExclusiveStartKey": response["LastEvaluatedKey"]}
        )
        items.extend(response.get("Items", []))
    return items


def _admin_required(user: dict[str, Any]) -> None:
    if not is_admin(user):
        raise HTTPException(status_code=403, detail="admin_required")


def _user_id(user: dict[str, Any]) -> str:
    return user.get("userId") or user.get("sub") or ""


def _message_allowed(message: dict[str, Any], user: dict[str, Any]) -> bool:
    return is_admin(user) or _user_id(user) in message.get("ownerUserIds", [])


def _get_message_or_404(message_id: str) -> dict[str, Any]:
    item = get_table("MESSAGES_TABLE").get_item(Key={"messageId": message_id}).get("Item")
    if not item:
        raise HTTPException(status_code=404, detail="message_not_found")
    return item


def _get_attachment_or_404(message_id: str, attachment_id: str) -> dict[str, Any]:
    item = get_table("ATTACHMENTS_TABLE").get_item(
        Key={"messageId": message_id, "attachmentId": attachment_id}
    ).get("Item")
    if not item:
        raise HTTPException(status_code=404, detail="attachment_not_found")
    return item


def _safe_download_filename(filename: str | None) -> str:
    cleaned = (filename or "attachment").split("/")[-1].split("\\")[-1].strip()
    cleaned = cleaned.replace("\r", "_").replace("\n", "_").replace('"', "_")
    return cleaned or "attachment"


def _status_rank(status: str | None) -> int:
    try:
        return STATUS_ORDER.index(status or "")
    except ValueError:
        return -1


def _hydrate_inbox_rows(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    table = get_table("MESSAGES_TABLE")
    hydrated = []
    for row in rows:
        message_id = row.get("messageId")
        message = table.get_item(Key={"messageId": message_id}).get("Item") if message_id else None
        if message:
            hydrated.append({**row, **message, "mailbox": row.get("mailbox") or message.get("mailbox")})
        else:
            hydrated.append(row)
    return hydrated


def _with_parsed_artifact(message: dict[str, Any]) -> dict[str, Any]:
    parsed_bucket = message.get("parsedBucket")
    parsed_key = message.get("parsedKey")
    if not parsed_bucket or not parsed_key:
        return message

    enriched = dict(message)
    try:
        parsed = s3_read_json(parsed_bucket, parsed_key)
    except Exception as exc:
        enriched["parsedError"] = str(exc)
        return enriched

    enriched["parsed"] = {
        "headers": parsed.get("headers", {}),
        "summary": parsed.get("summary", {}),
        "text": parsed.get("text", ""),
        "html": parsed.get("html", ""),
    }
    return enriched


def _as_bool(value: Optional[str]) -> Optional[bool]:
    if value is None or value == "":
        return None
    return value.lower() in {"1", "true", "yes", "y"}


def _filter_values(value: Optional[str]) -> set[str]:
    if not value:
        return set()
    return {part.strip() for part in value.split(",") if part.strip()}


def _matches_filter_value(actual: Any, expected: Optional[str]) -> bool:
    values = _filter_values(expected)
    return not values or str(actual or "") in values


def _matches_query(item: dict[str, Any], query: str) -> bool:
    haystack = " ".join(
        str(value or "")
        for value in [
            item.get("subject"),
            item.get("from"),
            item.get("sender"),
            item.get("mailbox"),
            item.get("mimeTo"),
            ",".join(item.get("recipients", [])) if isinstance(item.get("recipients"), list) else item.get("recipients"),
        ]
    ).lower()
    return query.lower() in haystack


def _sort_value(item: dict[str, Any], sort_by: str):
    if sort_by == "sender":
        return str(item.get("from") or item.get("sender") or "").lower()
    if sort_by == "mailbox":
        return str(item.get("mailbox") or item.get("mimeTo") or "").lower()
    if sort_by == "subject":
        return str(item.get("subject") or "").lower()
    if sort_by == "status":
        return _status_rank(item.get("status"))
    if sort_by == "finalVerdict":
        return str(item.get("finalVerdict") or "").lower()
    return str(item.get("receivedAt") or item.get("sortKey") or "")


def _sort_and_paginate(
    items: list[dict[str, Any]],
    *,
    sortBy: str = "receivedAt",
    sortDirection: str = "desc",
    limit: int = 25,
    cursor: Optional[str] = None,
) -> dict[str, Any]:
    try:
        limit = max(1, min(int(limit or 25), 100))
    except ValueError:
        limit = 25
    try:
        offset = max(0, int(cursor or 0))
    except ValueError:
        offset = 0
    reverse = sortDirection != "asc"
    sorted_items = sorted(items, key=lambda item: _sort_value(item, sortBy), reverse=reverse)
    page = sorted_items[offset:offset + limit]
    next_offset = offset + limit
    return {
        "items": _jsonable(page),
        "total": len(sorted_items),
        "limit": limit,
        "cursor": str(offset),
        "nextCursor": str(next_offset) if next_offset < len(sorted_items) else None,
    }


def _filter_messages(
    items: list[dict[str, Any]],
    *,
    q: Optional[str] = None,
    status: Optional[str] = None,
    finalVerdict: Optional[str] = None,
    mlVerdict: Optional[str] = None,
    virusVerdict: Optional[str] = None,
    hasAttachments: Optional[str] = None,
    mailbox: Optional[str] = None,
    userId: Optional[str] = None,
) -> list[dict[str, Any]]:
    filtered = items
    if q:
        filtered = [item for item in filtered if _matches_query(item, q)]
    if status:
        filtered = [item for item in filtered if _matches_filter_value(item.get("status"), status)]
    if finalVerdict:
        filtered = [item for item in filtered if _matches_filter_value(item.get("finalVerdict"), finalVerdict)]
    if mlVerdict:
        filtered = [item for item in filtered if _matches_filter_value(item.get("mlVerdict"), mlVerdict)]
    if virusVerdict:
        filtered = [item for item in filtered if _matches_filter_value(item.get("virusVerdict"), virusVerdict)]
    has_attachments = _as_bool(hasAttachments)
    if has_attachments is not None:
        filtered = [item for item in filtered if bool(item.get("hasAttachments")) == has_attachments]
    if mailbox:
        mailboxes = _filter_values(mailbox)
        filtered = [
            item for item in filtered
            if item.get("mailbox") in mailboxes or any(value in (item.get("recipients") or []) for value in mailboxes)
        ]
    if userId:
        user_ids = _filter_values(userId)
        filtered = [item for item in filtered if user_ids.intersection(item.get("ownerUserIds") or []) or item.get("userId") in user_ids]
    return filtered


def _attachments_for_message(message_id: str) -> list[dict[str, Any]]:
    return _query_all(
        get_table("ATTACHMENTS_TABLE"),
        KeyConditionExpression=Key("messageId").eq(message_id)
    )


def _extract_urls_and_domains(text: str) -> tuple[list[str], list[str]]:
    urls = sorted({match.rstrip(".,;:") for match in URL_RE.findall(text or "")})
    domains = set()
    for url in urls:
        parsed = urlparse(url)
        if parsed.hostname:
            domains.add(parsed.hostname.lower())
    domains.update(match.lower() for match in DOMAIN_RE.findall(text or ""))
    return urls, sorted(domains)


def _indicators_for(message: dict[str, Any], attachments: list[dict[str, Any]]) -> dict[str, Any]:
    parsed = message.get("parsed") or {}
    text = " ".join([
        parsed.get("text", ""),
        parsed.get("html", ""),
        str(parsed.get("headers", {})),
        str(message.get("subject", "")),
    ])
    urls, domains = _extract_urls_and_domains(text)
    reasons = []
    if message.get("mlVerdict") == "PHISHING":
        reasons.append("The ML classifier marked the body as phishing-like.")
    if message.get("virusVerdict") == "UNSAFE":
        reasons.append("One or more attachments matched the attachment scanner.")
    if message.get("finalVerdict") == "UNSAFE":
        reasons.append("The final verdict is unsafe because at least one detector raised a high-risk signal.")
    if message.get("mlCategory"):
        reasons.append(f"ML category: {message['mlCategory']}.")

    return {
        "messageId": message.get("messageId"),
        "reasons": reasons,
        "urls": urls,
        "domains": domains,
        "hashes": [
            {
                "attachmentId": item.get("attachmentId"),
                "filename": item.get("filename"),
                "sha256": item.get("sha256"),
                "verdict": item.get("scanVerdict"),
                "signature": item.get("clamavSignature"),
            }
            for item in attachments
            if item.get("sha256")
        ],
        "sender": message.get("from") or message.get("sender"),
        "recipients": message.get("recipients") or [],
    }


def _timeline_for(message: dict[str, Any], attachments: list[dict[str, Any]]) -> list[dict[str, Any]]:
    status = message.get("status")
    current_rank = _status_rank(status)
    has_attachments = bool(message.get("hasAttachments"))
    attachment_done = message.get("virusVerdict") in {"SAFE", "UNSAFE", "PARTIAL"} or not has_attachments
    facts = {
        "received": bool(message.get("receivedAt")),
        "recipients": bool(message.get("ownerUserIds")) or current_rank >= _status_rank("RECIPIENTS_RESOLVED"),
        "parsed": bool(message.get("parsedBucket") and message.get("parsedKey")) or current_rank >= _status_rank("PARSED"),
        "ml": bool(message.get("mlVerdict") and message.get("mlVerdict") != "PENDING") or current_rank >= _status_rank("ML_SCANNED"),
        "attachments": attachment_done,
        "complete": status in {"COMPLETE", "PARTIAL", "FAILED", "QUARANTINED"},
    }
    details = {
        "received": f"Raw message stored at {message.get('rawBucket', '-')}/{message.get('rawKey', '-')}",
        "recipients": f"Owners: {', '.join(message.get('ownerUserIds') or []) or '-'}",
        "parsed": f"Parsed artifact: {message.get('parsedBucket', '-')}/{message.get('parsedKey', '-')}",
        "ml": f"ML verdict: {message.get('mlVerdict', 'PENDING')}",
        "attachments": f"{len(attachments)} attachment record(s), virus verdict {message.get('virusVerdict', 'PENDING')}",
        "complete": f"Final verdict: {message.get('finalVerdict', 'PENDING')}",
    }
    fallback_timestamp = (
        message.get("completedAt")
        or message.get("lastReprocessedAt")
        or message.get("attachmentsScannedAt")
        or message.get("mlScannedAt")
        or message.get("parsedAt")
        or message.get("resolvedAt")
        or message.get("receivedAt")
    )
    timestamps = {
        "received": message.get("receivedAt") or fallback_timestamp,
        "recipients": message.get("resolvedAt") or fallback_timestamp,
        "parsed": message.get("parsedAt") or fallback_timestamp,
        "ml": message.get("mlScannedAt") or fallback_timestamp,
        "attachments": message.get("attachmentsScannedAt") or fallback_timestamp,
        "complete": message.get("completedAt") or fallback_timestamp,
    }
    timeline = []
    seen_incomplete = False
    for key, label in STEP_LABELS:
        done = facts[key]
        if done:
            step_status = "COMPLETE"
        elif not seen_incomplete:
            step_status = "CURRENT"
            seen_incomplete = True
        else:
            step_status = "PENDING"
        timeline.append({
            "id": key,
            "label": label,
            "status": step_status,
            "timestamp": timestamps.get(key),
            "detail": details[key],
        })
    return timeline


def _date_key(value: str | None) -> str:
    if not value:
        return "unknown"
    return value[:10]


@router.get("/messages")
def list_messages(
    q: Optional[str] = None,
    status: Optional[str] = None,
    finalVerdict: Optional[str] = None,
    mlVerdict: Optional[str] = None,
    virusVerdict: Optional[str] = None,
    hasAttachments: Optional[str] = None,
    mailbox: Optional[str] = None,
    sortBy: str = "receivedAt",
    sortDirection: str = "desc",
    limit: int = 25,
    cursor: Optional[str] = None,
    user=Depends(current_user),
):
    items = _hydrate_inbox_rows(_query_all(
        get_table("INBOX_TABLE"),
        KeyConditionExpression=Key("userId").eq(_user_id(user)),
        ScanIndexForward=False,
    ))

    items = _filter_messages(
        items,
        q=q,
        status=status,
        finalVerdict=finalVerdict,
        mlVerdict=mlVerdict,
        virusVerdict=virusVerdict,
        hasAttachments=hasAttachments,
        mailbox=mailbox,
    )
    return _sort_and_paginate(
        items,
        sortBy=sortBy,
        sortDirection=sortDirection,
        limit=limit,
        cursor=cursor,
    )


@router.get("/messages/{message_id}")
def get_message(message_id: str, user=Depends(current_user)):
    item = _get_message_or_404(message_id)
    if not _message_allowed(item, user):
        raise HTTPException(status_code=403, detail="forbidden")
    write_audit(actor=user, action="message.view", message_id=message_id)
    return _jsonable(_with_parsed_artifact(item))


@router.get("/messages/{message_id}/indicators")
def get_indicators(message_id: str, user=Depends(current_user)):
    item = _get_message_or_404(message_id)
    if not _message_allowed(item, user):
        raise HTTPException(status_code=403, detail="forbidden")
    message = _with_parsed_artifact(item)
    return _jsonable(_indicators_for(message, _attachments_for_message(message_id)))


@router.get("/messages/{message_id}/timeline")
def get_timeline(message_id: str, user=Depends(current_user)):
    item = _get_message_or_404(message_id)
    if not _message_allowed(item, user):
        raise HTTPException(status_code=403, detail="forbidden")
    return {"items": _jsonable(_timeline_for(item, _attachments_for_message(message_id)))}


@router.get("/messages/{message_id}/attachments")
def list_attachments(message_id: str, user=Depends(current_user)):
    item = _get_message_or_404(message_id)
    if not _message_allowed(item, user):
        raise HTTPException(status_code=403, detail="forbidden")
    rows = _query_all(
        get_table("ATTACHMENTS_TABLE"),
        KeyConditionExpression=Key("messageId").eq(message_id)
    )
    return {"items": _jsonable(rows)}


@router.get("/messages/{message_id}/attachments/{attachment_id}/download")
def download_attachment(message_id: str, attachment_id: str, user=Depends(current_user)):
    message = _get_message_or_404(message_id)
    if not _message_allowed(message, user):
        raise HTTPException(status_code=403, detail="forbidden")

    attachment = _get_attachment_or_404(message_id, attachment_id)
    bucket = attachment.get("s3Bucket")
    key = attachment.get("s3Key")
    if not bucket or not key:
        raise HTTPException(status_code=404, detail="attachment_artifact_not_found")

    try:
        data = s3_read(bucket, key)
    except Exception:
        raise HTTPException(status_code=404, detail="attachment_artifact_not_found")

    audit_action = "attachment.download.risky" if attachment.get("scanVerdict") != "SAFE" else "attachment.download"
    write_audit(
        actor=user,
        action=audit_action,
        message_id=message_id,
        metadata={
            "attachmentId": attachment_id,
            "filename": attachment.get("filename"),
            "scanVerdict": attachment.get("scanVerdict"),
        },
    )

    filename = _safe_download_filename(attachment.get("filename"))
    headers = {
        "Content-Disposition": f'attachment; filename="{filename}"; filename*=UTF-8\'\'{quote(filename, safe="")}',
        "X-Scan-Verdict": str(attachment.get("scanVerdict") or "UNKNOWN"),
        "X-Scan-Status": str(attachment.get("scanStatus") or "UNKNOWN"),
    }
    if attachment.get("clamavSignature"):
        headers["X-ClamAV-Signature"] = str(attachment["clamavSignature"])

    return Response(
        content=data,
        media_type=attachment.get("contentType") or "application/octet-stream",
        headers=headers,
    )


@router.get("/admin/messages")
def admin_messages(
    q: Optional[str] = None,
    status: Optional[str] = None,
    finalVerdict: Optional[str] = None,
    mlVerdict: Optional[str] = None,
    virusVerdict: Optional[str] = None,
    hasAttachments: Optional[str] = None,
    mailbox: Optional[str] = None,
    userId: Optional[str] = None,
    sortBy: str = "receivedAt",
    sortDirection: str = "desc",
    limit: int = 25,
    cursor: Optional[str] = None,
    user=Depends(current_user),
):
    _admin_required(user)
    items = _filter_messages(
        _scan_all("MESSAGES_TABLE"),
        q=q,
        status=status,
        finalVerdict=finalVerdict,
        mlVerdict=mlVerdict,
        virusVerdict=virusVerdict,
        hasAttachments=hasAttachments,
        mailbox=mailbox,
        userId=userId,
    )
    return _sort_and_paginate(
        items,
        sortBy=sortBy,
        sortDirection=sortDirection,
        limit=limit,
        cursor=cursor,
    )


@router.post("/admin/messages/{message_id}/reprocess")
def reprocess_message(message_id: str, user=Depends(current_user)):
    _admin_required(user)
    message = _get_message_or_404(message_id)
    raw_bucket = message.get("rawBucket")
    raw_key = message.get("rawKey")
    if not raw_bucket or not raw_key:
        raise HTTPException(status_code=400, detail="raw_artifact_missing")

    region = os.getenv("AWS_REGION", os.getenv("AWS_DEFAULT_REGION", "eu-central-1"))
    prefix = os.getenv("LOCAL_PREFIX", "cloud-email-analyzer-local-dev")
    account_id = os.getenv("LOCALSTACK_ACCOUNT_ID", "000000000000")
    state_machine_arn = os.getenv(
        "EMAIL_PIPELINE_STATE_MACHINE_ARN",
        f"arn:aws:states:{region}:{account_id}:stateMachine:{prefix}-email-pipeline",
    )
    detail = {
        "tenantId": message.get("tenantId", "demo"),
        "messageId": message_id,
        "receivedAt": message.get("receivedAt"),
        "source": "manual-reprocess",
        "raw": {"bucket": raw_bucket, "key": raw_key},
        "envelope": {
            "mailFrom": message.get("from", ""),
            "recipients": message.get("recipients") or ([message.get("mimeTo")] if message.get("mimeTo") else []),
        },
        "headers": {
            "from": message.get("from", ""),
            "to": message.get("recipients") or [],
            "subject": message.get("subject", ""),
        },
        "sesVerdicts": {
            "spamVerdict": "UNKNOWN",
            "virusVerdict": "UNKNOWN",
            "spfVerdict": "UNKNOWN",
            "dkimVerdict": "UNKNOWN",
            "dmarcVerdict": "UNKNOWN",
        },
    }
    try:
        execution = stepfunctions_client().start_execution(
            stateMachineArn=state_machine_arn,
            name=new_execution_name(message_id),
            input=json.dumps(detail),
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"reprocess_start_failed: {exc}")
    get_table("MESSAGES_TABLE").update_item(
        Key={"messageId": message_id},
        UpdateExpression="SET lastReprocessedAt = :now, lastReprocessExecutionArn = :arn",
        ExpressionAttributeValues={
            ":now": datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
            ":arn": execution.get("executionArn", ""),
        },
    )
    write_audit(
        actor=user,
        action="message.reprocess",
        message_id=message_id,
        metadata={"executionArn": execution.get("executionArn", "")},
    )
    return {"ok": True, "executionArn": execution.get("executionArn")}


@router.get("/admin/audit-log")
def audit_log(
    q: Optional[str] = None,
    action: Optional[str] = None,
    actor: Optional[str] = None,
    role: Optional[str] = None,
    messageId: Optional[str] = None,
    limit: int = 50,
    cursor: Optional[str] = None,
    user=Depends(current_user),
):
    _admin_required(user)
    try:
        items = _scan_all("AUDIT_TABLE")
    except Exception as exc:
        logger.exception("audit_log_read_failed")
        raise HTTPException(status_code=503, detail="audit_log_unavailable") from exc
    if action:
        actions = _filter_values(action)
        items = [item for item in items if item.get("action") in actions]
    if q:
        q_l = q.lower()
        items = [
            item for item in items
            if q_l in " ".join([
                str(item.get("action", "")),
                str(item.get("actorEmail", "")),
                str(item.get("actorUserId", "")),
                str(item.get("actorRole", "")),
                str(item.get("messageId", "")),
                json.dumps(item.get("metadata", {}), default=str),
            ]).lower()
        ]
    if actor:
        actor_l = actor.lower()
        items = [
            item for item in items
            if actor_l in str(item.get("actorEmail", "")).lower()
            or actor_l in str(item.get("actorUserId", "")).lower()
        ]
    if role:
        roles = _filter_values(role)
        items = [item for item in items if item.get("actorRole") in roles]
    if messageId:
        items = [item for item in items if item.get("messageId") == messageId]
    try:
        normalized_limit = max(1, min(int(limit or 50), 200))
    except (TypeError, ValueError):
        normalized_limit = 50
    try:
        offset = max(0, int(cursor or 0))
    except (TypeError, ValueError):
        offset = 0
    sorted_items = sorted(items, key=lambda item: item.get("sortKey") or item.get("timestamp") or "", reverse=True)
    page = sorted_items[offset:offset + normalized_limit]
    next_offset = offset + normalized_limit
    return {
        "items": _jsonable(page),
        "total": len(sorted_items),
        "limit": normalized_limit,
        "cursor": str(offset),
        "nextCursor": str(next_offset) if next_offset < len(sorted_items) else None,
    }


@router.get("/admin/metrics/security-summary")
def security_summary(user=Depends(current_user)):
    _admin_required(user)
    messages = _scan_all("MESSAGES_TABLE")
    attachments = _scan_all("ATTACHMENTS_TABLE")
    verdict_counts = Counter(message.get("finalVerdict", "PENDING") for message in messages)
    ml_counts = Counter(message.get("mlVerdict", "PENDING") for message in messages)
    virus_counts = Counter(message.get("virusVerdict", "PENDING") for message in messages)
    status_counts = Counter(message.get("status", "UNKNOWN") for message in messages)
    sender_counts = Counter((message.get("from") or message.get("sender") or "unknown") for message in messages)
    mailbox_counts = Counter(
        mailbox
        for message in messages
        for mailbox in (message.get("recipients") or [message.get("mimeTo") or "unknown"])
    )
    unsafe_attachments = sum(1 for attachment in attachments if attachment.get("scanVerdict") == "UNSAFE")
    return _jsonable({
        "totals": {
            "messages": len(messages),
            "attachments": len(attachments),
            "unsafeMessages": verdict_counts.get("UNSAFE", 0),
            "phishingMessages": ml_counts.get("PHISHING", 0),
            "unsafeAttachments": unsafe_attachments,
            "needsReview": sum(1 for message in messages if message.get("status") in {"FAILED", "PARTIAL", "QUARANTINED"}),
        },
        "verdictCounts": dict(verdict_counts),
        "mlCounts": dict(ml_counts),
        "virusCounts": dict(virus_counts),
        "statusCounts": dict(status_counts),
        "topSenders": [{"sender": sender, "count": count} for sender, count in sender_counts.most_common(5)],
        "mailboxes": [{"mailbox": mailbox, "count": count} for mailbox, count in mailbox_counts.most_common(8)],
    })


@router.get("/admin/metrics/verdicts-over-time")
def verdicts_over_time(user=Depends(current_user)):
    _admin_required(user)
    buckets: dict[str, Counter] = defaultdict(Counter)
    for message in _scan_all("MESSAGES_TABLE"):
        day = _date_key(message.get("receivedAt"))
        buckets[day][message.get("finalVerdict", "PENDING")] += 1
        buckets[day]["total"] += 1
    return {
        "items": [
            {"date": day, **dict(counts)}
            for day, counts in sorted(buckets.items())
        ]
    }


@router.get("/admin/users")
def admin_users(user=Depends(current_user)):
    _admin_required(user)
    items = [public_user(item) for item in _scan_all("USERS_TABLE")]
    return {"items": _jsonable(items)}


@router.get("/admin/mailboxes")
def admin_mailboxes(user=Depends(current_user)):
    _admin_required(user)
    return {"items": _jsonable(_scan_all("MAILBOXES_TABLE"))}
