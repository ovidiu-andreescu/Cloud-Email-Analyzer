import os
import mimetypes
import hashlib
from urllib.parse import quote
from email.message import EmailMessage
from email import policy
from email.parser import BytesParser

from services_common.aws_helper import s3_write , s3_write_bytes, get_table
from services_common.aws_helper import get_s3
from services_common.contracts import attachment_id, detail_from_event, ensure_artifacts

MESSAGES = get_table("MESSAGES_TABLE")
ATTACHMENTS = get_table("ATTACHMENTS_TABLE")

def out_prefix():
    return os.environ.get("OUT_PREFIX", "parsed/")


def get_att():
    return os.environ.get("ATTACH_PREFIX", "attachments/")


def handler(event, context):
    detail = ensure_artifacts(detail_from_event(event))
    message_id = detail["messageId"]
    raw = detail["raw"]
    bucket = raw["bucket"]
    artifact_bucket = os.environ.get("ARTIFACTS_BUCKET", bucket)
    key = raw["key"]
    raw_bytes = get_s3().get_object(Bucket=bucket, Key=key)["Body"].read()
    msg = BytesParser(policy=policy.default).parsebytes(raw_bytes)

    assert isinstance(msg, EmailMessage)

    headers = {k: str(v) for (k, v) in msg.items()}
    subject = msg.get("subject", "")
    from_ = msg.get("from", "")
    to = msg.get("to", "")

    text_body = ""
    html_body = ""
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

                data = part.get_payload(decode=True) or b""
                att_id = attachment_id(len(saved_attachments), fname, data)
                out_key = f"{get_att()}{message_id}/{att_id}"

                try:
                    s3_write_bytes(
                        artifact_bucket,
                        out_key,
                        data,
                        content_type=ctype,
                        metadata={"messageId": message_id, "attachmentId": att_id}
                    )
                except Exception as e:
                    print(f"Error uploading attachment: {e}")
                    continue

                sha256 = hashlib.sha256(data).hexdigest()
                att = {
                    "messageId": message_id,
                    "attachmentId": att_id,
                    "filename": fname,
                    "contentType": ctype,
                    "sizeBytes": len(data),
                    "sha256": sha256,
                    "s3Bucket": artifact_bucket,
                    "s3Key": out_key,
                    "scanStatus": "PENDING",
                    "scanVerdict": "PENDING",
                }
                ATTACHMENTS.put_item(Item=att)
                saved_attachments.append(att)

            elif ctype == "text/plain" and not text_body:
                text_body = (part.get_payload(decode=True) or b"").decode(part.get_content_charset("utf-8"), "replace")
            elif ctype == "text/html" and not html_body:
                html_body = (part.get_payload(decode=True) or b"").decode(part.get_content_charset("utf-8"), "replace")

    else:
        ctype = msg.get_content_type()
        if ctype == "text/plain":
            text_body = (msg.get_payload(decode=True) or b"").decode(msg.get_content_charset("utf-8"), "replace")
        elif ctype == "text/html":
            html_body = (msg.get_payload(decode=True) or b"").decode(msg.get_content_charset("utf-8"), "replace")

    summary = {
        "messageId": message_id,
        "subject": subject,
        "from": from_,
        "to": to,
        "hasHtml": bool(html_body),
        "textPreview": (text_body or "")[:1000]
    }
    out_key = f"{out_prefix()}{message_id}/body.json"

    s3_write(artifact_bucket, out_key, {
        "headers": headers,
        "summary": summary,
        "text": text_body,
        "html": html_body,
        "attachments": saved_attachments,
    }, metadata={"messageId": message_id})

    has_attachments = len(saved_attachments) > 0

    MESSAGES.update_item(
        Key={"messageId": message_id},
        UpdateExpression="SET subject = :sub, #from = :frm, mimeTo = :recip, hasAttachments = :ha, "
                         "attachmentCount = :ac, parsedBucket = :pb, parsedKey = :pk, #st = :st",
        ExpressionAttributeNames={"#st": "status", "#from": "from"},
        ExpressionAttributeValues={
            ":sub": subject,
            ":frm": from_,
            ":recip": to,
            ":ha": has_attachments,
            ":ac": len(saved_attachments),
            ":pb": artifact_bucket,
            ":pk": out_key,
            ":st": "PARSED",
        }
    )

    detail["artifacts"]["parsed"] = {"bucket": artifact_bucket, "key": out_key}
    detail["artifacts"]["attachments"] = saved_attachments
    detail["artifacts"]["attachmentsPrefix"] = f"{get_att()}{message_id}/"
    detail["mail"] = {"subject": subject, "from": from_, "to": to}
    detail["hasAttachments"] = has_attachments

    return detail
