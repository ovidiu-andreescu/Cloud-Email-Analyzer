from botocore.exceptions import ClientError
from services_common.aws_helper import get_table
from services_common.contracts import detail_from_event

table_name = "MESSAGES_TABLE"
TABLE = get_table(table_name)

def handler(event, context):
    detail = detail_from_event(event)
    msg_id = detail["messageId"]
    raw = detail["raw"]
    headers = detail.get("headers", {})
    envelope = detail.get("envelope", {})

    item = {
        "messageId": msg_id,
        "tenantId": detail.get("tenantId", "demo"),
        "receivedAt": detail["receivedAt"],
        "source": detail.get("source", "unknown"),
        "from": envelope.get("mailFrom") or headers.get("from", ""),
        "recipients": envelope.get("recipients", []),
        "subject": headers.get("subject", ""),
        "rawBucket": raw["bucket"],
        "rawKey": raw["key"],
        "status": "RECEIVED",
        "mlVerdict": "PENDING",
        "virusVerdict": "PENDING",
        "finalVerdict": "PENDING",
        "hasAttachments": False,
        "attachmentCount": 0,
    }

    try:
        TABLE.put_item(
            Item=item,
            ConditionExpression="attribute_not_exists(messageId)"
        )
    except ClientError as e:
        if e.response["Error"]["Code"] == "ConditionalCheckFailedException":
            print(f"Idempotent trigger for {msg_id}. Already received.")
        else:
            print(f"Failed to create initial record for {msg_id}: {e}")
            raise

    detail["ledger"] = {"ok": True, "messageId": msg_id}
    return detail
