import os, time, boto3
from datetime import datetime, timezone

from botocore.exceptions import ClientError
from services_common.aws_helper import get_table

table_name = "LEDGER_TABLE"
TABLE = get_table(table_name)
GSI_PK_VALUE = "EMAILS"

def handler(event, context):
    try:
        key = event["detail"]["object"]["key"]
    except KeyError:
        print("Failed to find S3 key in event. Check payload.")
        print("EVENT: ", event)
        raise

    msg_id = key.rsplit("/", 1)[-1].removesuffix(".eml")

    now_iso = datetime.now(timezone.utc).isoformat()

    item = {
        "messageId": msg_id,
        "sk": "meta",
        "gsi_pk": GSI_PK_VALUE,
        "s3KeyRaw": key,
        "receivedAt": now_iso,
        "verdict": "PROCESSING"
    }

    try:
        TABLE.put_item(
            Item=item,
            ConditionExpression="attribute_not_exists(sk)"
        )

        event["ledger_result"] = {
            "ok": True,
            "msgId": msg_id,
            "s3Key": key,
            "bucket": event["detail"]["bucket"]["name"]
        }

        return event

    except ClientError as e:
        if e.response["Error"]["Code"] == "ConditionalCheckFailedException":
            print(f"Idempotent trigger for {msg_id}. Already processing.")
            return {"ok": True, "idempotent": True, "msgId": msg_id, "s3Key": key}

        print(f"Failed to create initial record for {msg_id}: {e}")
        raise