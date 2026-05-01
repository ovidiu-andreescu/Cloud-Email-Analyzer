from datetime import datetime, timezone

from services_common.aws_helper import get_table
from services_common.contracts import detail_from_event


MESSAGES = get_table("MESSAGES_TABLE")
MAILBOXES = get_table("MAILBOXES_TABLE")
INBOX = get_table("INBOX_TABLE")


def _now():
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def _mailbox_for(address: str):
    if not address:
        return None
    resp = MAILBOXES.get_item(Key={"emailAddress": address.lower()})
    return resp.get("Item")


def handler(event, context):
    detail = detail_from_event(event)
    tenant_id = detail.get("tenantId", "demo")
    message_id = detail["messageId"]
    received_at = detail["receivedAt"]
    recipients = [r.lower() for r in detail.get("envelope", {}).get("recipients", []) if r]

    owner_user_ids = set()
    mailbox_rows = []
    unknown = []

    for recipient in recipients:
        mailbox = _mailbox_for(recipient)
        if not mailbox:
            unknown.append(recipient)
            continue
        for user_id in mailbox.get("ownerUserIds", []):
            owner_user_ids.add(user_id)
            mailbox_rows.append((user_id, recipient))

    if unknown:
        owner_user_ids.add("USER#admin")
        for recipient in unknown:
            mailbox_rows.append(("USER#admin", recipient))

    if not mailbox_rows:
        mailbox_rows.append(("USER#admin", "quarantine@demo.local"))
        owner_user_ids.add("USER#admin")

    sender = detail.get("envelope", {}).get("mailFrom") or detail.get("headers", {}).get("from", "")
    subject = detail.get("headers", {}).get("subject", "")
    status = "QUARANTINED" if unknown else "RECIPIENTS_RESOLVED"

    for user_id, mailbox in mailbox_rows:
        INBOX.put_item(Item={
            "userId": user_id,
            "sortKey": f"{received_at}#{message_id}",
            "tenantId": tenant_id,
            "messageId": message_id,
            "mailbox": mailbox,
            "from": sender,
            "subject": subject,
            "status": status,
            "finalVerdict": "PENDING",
            "mlVerdict": "PENDING",
            "virusVerdict": "PENDING",
        })

    MESSAGES.update_item(
        Key={"messageId": message_id},
        UpdateExpression="SET ownerUserIds = :owners, unresolvedRecipients = :unknown, #st = :st, resolvedAt = :now",
        ExpressionAttributeNames={"#st": "status"},
        ExpressionAttributeValues={
            ":owners": sorted(owner_user_ids),
            ":unknown": unknown,
            ":st": status,
            ":now": _now(),
        },
    )

    detail["ownerUserIds"] = sorted(owner_user_ids)
    detail["unresolvedRecipients"] = unknown
    detail["status"] = status
    return detail
