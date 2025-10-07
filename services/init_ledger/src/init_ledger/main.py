import os, time, boto3
from botocore.exceptions import ClientError

DDB   = boto3.resource('dynamodb')
TABLE = DDB.Table(os.environ['LEDGER_TABLE'])

def handler(event, context):
    key = event["key"]
    msg_id = event.get("sesMessageId") or key.rsplit("/", 1)[-1].removesuffix(".eml")
    now = int(time.time())

    item = {
        "messageId": msg_id,
        "status": "PENDING",
        "createdAt": now,
        "updatedAt": now,
        "bucket": event["bucket"],
        "key": key
    }

    try:
        TABLE.put_item(
            Item=item,
            ConditionExpression="attribute_not_exists(messageId)"
        )

        event["messageId"] = msg_id
        return {"ok": True, **event}
    except ClientError as e:
        if e.response["Error"]["Code"] == "ConditionalCheckFailedException":
            event["messageId"] = msg_id
            return {"ok": True, "idempotent": True, **event}
        raise