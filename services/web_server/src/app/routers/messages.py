from decimal import Decimal
from typing import Any, Optional

from boto3.dynamodb.conditions import Key
from fastapi import APIRouter, Depends, HTTPException, Query

from services_common.aws_helper import get_table, s3_read_json
from ..auth import current_user, is_admin


router = APIRouter(tags=["messages"])


def _jsonable(value):
    if isinstance(value, Decimal):
        return float(value)
    if isinstance(value, list):
        return [_jsonable(v) for v in value]
    if isinstance(value, dict):
        return {k: _jsonable(v) for k, v in value.items()}
    return value


def _message_allowed(message: dict[str, Any], user: dict[str, Any]) -> bool:
    return is_admin(user) or user["sub"] in message.get("ownerUserIds", [])


def _get_message_or_404(message_id: str) -> dict[str, Any]:
    item = get_table("MESSAGES_TABLE").get_item(Key={"messageId": message_id}).get("Item")
    if not item:
        raise HTTPException(status_code=404, detail="message_not_found")
    return item


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


@router.get("/messages")
def list_messages(
    status: Optional[str] = None,
    finalVerdict: Optional[str] = None,
    user=Depends(current_user),
):
    if is_admin(user):
        items = get_table("MESSAGES_TABLE").scan().get("Items", [])
    else:
        items = get_table("INBOX_TABLE").query(
            KeyConditionExpression=Key("userId").eq(user["sub"]),
            ScanIndexForward=False,
        ).get("Items", [])

    if status:
        items = [i for i in items if i.get("status") == status]
    if finalVerdict:
        items = [i for i in items if i.get("finalVerdict") == finalVerdict]
    return {"items": _jsonable(items)}


@router.get("/messages/{message_id}")
def get_message(message_id: str, user=Depends(current_user)):
    item = _get_message_or_404(message_id)
    if not _message_allowed(item, user):
        raise HTTPException(status_code=403, detail="forbidden")
    return _jsonable(_with_parsed_artifact(item))


@router.get("/messages/{message_id}/attachments")
def list_attachments(message_id: str, user=Depends(current_user)):
    item = _get_message_or_404(message_id)
    if not _message_allowed(item, user):
        raise HTTPException(status_code=403, detail="forbidden")
    rows = get_table("ATTACHMENTS_TABLE").query(
        KeyConditionExpression=Key("messageId").eq(message_id)
    ).get("Items", [])
    return {"items": _jsonable(rows)}


@router.get("/admin/messages")
def admin_messages(user=Depends(current_user)):
    if not is_admin(user):
        raise HTTPException(status_code=403, detail="admin_required")
    return {"items": _jsonable(get_table("MESSAGES_TABLE").scan().get("Items", []))}


@router.get("/admin/users")
def admin_users(user=Depends(current_user)):
    if not is_admin(user):
        raise HTTPException(status_code=403, detail="admin_required")
    return {"items": _jsonable(get_table("USERS_TABLE").scan().get("Items", []))}


@router.get("/admin/mailboxes")
def admin_mailboxes(user=Depends(current_user)):
    if not is_admin(user):
        raise HTTPException(status_code=403, detail="admin_required")
    return {"items": _jsonable(get_table("MAILBOXES_TABLE").scan().get("Items", []))}
