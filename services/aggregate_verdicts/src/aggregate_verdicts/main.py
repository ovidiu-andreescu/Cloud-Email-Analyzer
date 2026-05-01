from boto3.dynamodb.conditions import Key
from datetime import datetime, timezone

from services_common.aws_helper import get_table
from services_common.contracts import detail_from_event


MESSAGES = get_table("MESSAGES_TABLE")
ATTACHMENTS = get_table("ATTACHMENTS_TABLE")
INBOX = get_table("INBOX_TABLE")


def _query_all(table, **kwargs):
    response = table.query(**kwargs)
    items = response.get("Items", [])
    while response.get("LastEvaluatedKey"):
        response = table.query(
            **{**kwargs, "ExclusiveStartKey": response["LastEvaluatedKey"]}
        )
        items.extend(response.get("Items", []))
    return items


def _virus_from_attachments(items):
    if not items:
        return "SAFE"
    verdicts = {i.get("scanVerdict", "PENDING") for i in items}
    if "UNSAFE" in verdicts:
        return "UNSAFE"
    if verdicts.intersection({"SCAN_ERROR", "TIMEOUT", "SKIPPED_TOO_LARGE", "PENDING"}):
        return "PARTIAL"
    return "SAFE"


def _final(ml, virus):
    if virus == "UNSAFE" or ml == "PHISHING":
        return "UNSAFE"
    if virus == "PARTIAL" or ml in {"ERROR", "PENDING"}:
        return "SUSPICIOUS"
    return "SAFE"


def handler(event, context):
    detail = detail_from_event(event)
    message_id = detail["messageId"]
    msg = MESSAGES.get_item(Key={"messageId": message_id}).get("Item", {})
    attachments = _query_all(
        ATTACHMENTS,
        KeyConditionExpression=Key("messageId").eq(message_id)
    )

    ml = msg.get("mlVerdict", "PENDING")
    virus = _virus_from_attachments(attachments)
    final = _final(ml, virus)
    status = "PARTIAL" if virus == "PARTIAL" else "COMPLETE"
    now = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")

    MESSAGES.update_item(
        Key={"messageId": message_id},
        UpdateExpression="SET virusVerdict = :vv, finalVerdict = :fv, completedAt = :now, #st = :st",
        ExpressionAttributeNames={"#st": "status"},
        ExpressionAttributeValues={":vv": virus, ":fv": final, ":now": now, ":st": status},
    )

    for user_id in msg.get("ownerUserIds", []):
        rows = _query_all(INBOX, KeyConditionExpression=Key("userId").eq(user_id))
        for row in rows:
            if row.get("messageId") == message_id:
                INBOX.update_item(
                    Key={"userId": user_id, "sortKey": row["sortKey"]},
                    UpdateExpression="SET finalVerdict = :fv, virusVerdict = :vv, mlVerdict = :mv, #st = :st",
                    ExpressionAttributeNames={"#st": "status"},
                    ExpressionAttributeValues={":fv": final, ":vv": virus, ":mv": ml, ":st": status},
                )

    detail["virusVerdict"] = virus
    detail["finalVerdict"] = final
    detail["status"] = status
    return detail
