from services_common.aws_helper import s3_read, s3
from email import policy
from email.parser import BytesParser

def mail_extract(event):
    bucket = event["bucket"]
    key = event["key"]
    message_id = event.get("messageId") or key.rsplit("/", 1)[-1].removesuffix(".eml")

    raw = s3.get_object(Bucket=bucket, Key=key)["Body"].read()
    msg = BytesParser(policy=policy.default).parsebytes(raw)

    return {
        "messageId": message_id,
        "msg": msg,
        "bucket": bucket,
        "key": key
    }
