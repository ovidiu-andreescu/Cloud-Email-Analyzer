import os
import email
import mimetypes
from urllib.parse import quote
from email.message import EmailMessage

from services_common.mail_helper import mail_extract
from services_common.aws_helper import s3_write
from services_common.aws_helper import s3_write_bytes


def out_prefix():
    return os.environ.get("OUT_PREFIX", "parsed/")


def get_att():
    return os.environ.get("ATTACH_PREFIX", "attachments/")


def handler(event, context):
    result = mail_extract(event)
    message_id = result["messageId"]
    msg = result["msg"]
    bucket = result["bucket"]

    assert isinstance(msg, EmailMessage)

    headers = {k: str(v) for (k, v) in msg.items()}
    subject = msg.get("subject", "")
    from_ = msg.get("from", "")
    to = msg.get("to", "")

    text_body = None
    html_body = None
    saved_attachments = []

    if msg.is_multipart():
        for part in msg.walk():
            ctype = part.get_content_type()
            disp = (part.get("Content-Disposition") or "").lower()

            if "attachment" in disp or part.is_attachment():
                fname = part.get_filename()
                if not fname:
                    ext = mimetypes.guess_extension(ctype) or ".dat"
                    fname = f"part-{part.get_cid() or 'unknown'}{ext}"

                data = part.get_payload(decode=True)
                if data:
                    out_key = f"{get_att()}{message_id}/{quote(fname)}"

                    try:
                        s3_write_bytes(
                            bucket,
                            out_key,
                            data,
                            content_type=ctype,
                            metadata={"messageId": message_id}
                        )
                    except Exception as e:
                        print(f"Error uploading attachment: {e}")
                        continue

                    saved_attachments.append({"bucket": bucket, "key": out_key, "filename": fname, "size": len(data)})

            elif ctype == "text/plain" and text_body is None:
                text_body = part.get_payload(decode=True).decode(part.get_content_charset("utf-8"))
            elif ctype == "text/html" and html_body is None:
                html_body = part.get_payload(decode=True).decode(part.get_content_charset("utf-8"))

    else:
        ctype = msg.get_content_type()
        if ctype == "text/plain":
            text_body = msg.get_payload(decode=True).decode(msg.get_content_charset("utf-8"))
        elif ctype == "text/html":
            html_body = msg.get_payload(decode=True).decode(msg.get_content_charset("utf-8"))

    summary = {
        "messageId": message_id,
        "subject": subject,
        "from": from_,
        "to": to,
        "hasHtml": html_body is not None,
        "textPreview": (text_body or "")[:1000]
    }
    out_key = f"{out_prefix()}{message_id}.json"

    s3_write(bucket, out_key, {
        "headers": headers,
        "summary": summary
    }, metadata={"messageId": message_id})

    event.setdefault("artifacts", {})
    event["artifacts"]["parsed"] = {"bucket": bucket, "key": out_key}
    event["artifacts"]["attachments"] = saved_attachments
    event["mail"] = {"subject": subject, "from": from_, "to": to}

    event["maybeHasAttachments"] = len(saved_attachments) > 0

    return event