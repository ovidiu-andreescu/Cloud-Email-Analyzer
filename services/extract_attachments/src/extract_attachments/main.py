import os
from urllib.parse import quote

from services_common.mail_helper import mail_extract
from services_common.aws_helper import s3_write

def get_att():
    return os.environ.get("ATTACH_PREFIX", "attachments/")

def handler(event, context):
    message_id, msg, bucket, key = mail_extract(event)

    saved = []
    if msg.is_multipart():
        for idx, part in enumerate(msg.iter_attachments()):
            fname = part.get_filename() or f"part-{idx}"
            data = part.get_payload(decode=True) or b""
            out_key = f"{get_att()}{message_id}/{quote(fname)}"
            s3_write(bucket, out_key, data, metadata={"messageId": message_id})
            saved.append({"bucket": bucket, "key": out_key, "filename": fname, "size": len(data)})

    event.setdefault("artifacts", {})
    event["artifacts"]["attachments"] = saved
    event["hasAttachments"] = len(saved) > 0

    return event