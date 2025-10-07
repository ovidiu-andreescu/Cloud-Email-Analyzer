import os

from services_common.mail_helper import mail_extract
from services_common.s3_ops import s3_write

OUT_PREFIX = os.environ.get("OUT_PREFIX", "parsed/")

def handler(event, context):
    message_id, msg, bucket, key = mail_extract(event)

    headers = {k: str(v) for (k, v) in msg.items()}
    subject = msg.get("subject", "")
    from_ = msg.get("from", "")
    to = msg.get("to", "")

    text_body = None
    html_body = None
    maybe_has = False
    if msg.is_multipart():
        for part in msg.walk():
            ctype = part.get_content_type()
            disp = (part.get("Content-Disposition") or "").lower()
            if "attachment" in disp:
                maybe_has = True
                break
            if ctype == "text/plain" and text_body is None:
                text_body = part.get_content()
            elif ctype == "text/html" and html_body is None:
                html_body = part.get_content()
    else:
        if msg.get_content_type() == "text/plain":
            text_body = msg.get_content()
        elif msg.get_content_type() == "text/html":
            html_body = msg.get_content()

    summary = {
        "messageId": message_id,
        "subject": subject,
        "from": from_,
        "to": to,
        "hasHtml": html_body is not None,
        "textPreview": (text_body or "")[:1000]
    }

    out_key = f"{OUT_PREFIX}{message_id}.json"
    s3_write(bucket, out_key, {
        "headers": headers,
        "summary": summary
    }, metadata={"messageId": message_id})

    event.setdefault("artifacts", {})
    event["artifacts"]["parsed"] = {"bucket": bucket, "key": out_key}
    event["mail"] = {"subject": subject, "from": from_, "to": to}
    event["maybeHasAttachments"] = maybe_has
    return event