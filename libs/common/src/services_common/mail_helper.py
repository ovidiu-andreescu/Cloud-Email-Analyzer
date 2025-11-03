from services_common.aws_helper import s3_read, s3
from email import policy
from email.parser import BytesParser


def mail_extract(event):
    bucket = None
    key = None

    try:
        bucket = event['detail']['bucket']['name']
        key = event['detail']['object']['key']

    except (KeyError, TypeError):
        try:
            bucket = event["bucket"]
            key = event["key"]
        except (KeyError, TypeError):
            raise ValueError("Event does not contain 'bucket'/'key' or 'detail.bucket.name'/'detail.object.key'")


    message_id = event.get("messageId")

    if not message_id:
        filename = key.rsplit("/", 1)[-1]
        message_id = filename.removesuffix(".eml")

    raw = s3.get_object(Bucket=bucket, Key=key)["Body"].read()
    msg = BytesParser(policy=policy.default).parsebytes(raw)

    return {
        "messageId": message_id,
        "msg": msg,
        "bucket": bucket,
        "key": key
    }
