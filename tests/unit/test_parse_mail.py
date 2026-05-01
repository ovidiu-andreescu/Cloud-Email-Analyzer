from email.message import EmailMessage
from io import BytesIO
from pathlib import Path
import sys

import pytest

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "services/parse_email/src"))
sys.path.insert(0, str(ROOT / "libs/common/src"))


class FakeS3:
    def __init__(self, raw: bytes):
        self.raw = raw

    def get_object(self, Bucket, Key):
        return {"Body": BytesIO(self.raw)}


class FakeTable:
    def __init__(self):
        self.items = []
        self.updates = []

    def put_item(self, Item):
        self.items.append(Item)

    def update_item(self, **kwargs):
        self.updates.append(kwargs)


def _event(message_id="msg-1"):
    return {
        "tenantId": "demo",
        "messageId": message_id,
        "receivedAt": "2026-05-01T12:00:00Z",
        "raw": {"bucket": "raw-bucket", "key": f"raw/{message_id}.eml"},
        "envelope": {"mailFrom": "sender@example.com", "recipients": ["alice@demo.local"]},
        "headers": {"from": "sender@example.com", "subject": "Test message"},
    }


def _email_with_attachment() -> bytes:
    msg = EmailMessage()
    msg["Subject"] = "Attachment test"
    msg["From"] = "sender@example.com"
    msg["To"] = "alice@demo.local"
    msg.set_content("Plain body")
    msg.add_attachment(b"file-bytes", maintype="text", subtype="plain", filename="note.txt")
    return msg.as_bytes()


def test_handler_writes_parsed_body_and_attachment_records(monkeypatch):
    from parse_email import main

    messages = FakeTable()
    attachments = FakeTable()
    json_writes = []
    byte_writes = []

    monkeypatch.setattr(main, "get_s3", lambda: FakeS3(_email_with_attachment()))
    monkeypatch.setattr(main, "MESSAGES", messages)
    monkeypatch.setattr(main, "ATTACHMENTS", attachments)
    monkeypatch.setattr(main, "s3_write", lambda *args, **kwargs: json_writes.append((args, kwargs)))
    monkeypatch.setattr(main, "s3_write_bytes", lambda *args, **kwargs: byte_writes.append((args, kwargs)))

    result = main.handler(_event(), None)

    assert result["artifacts"]["parsed"] == {
        "bucket": "raw-bucket",
        "key": "parsed/msg-1/body.json",
    }
    assert result["hasAttachments"] is True
    assert len(result["artifacts"]["attachments"]) == 1

    assert byte_writes[0][0][0] == "raw-bucket"
    assert byte_writes[0][0][1].startswith("attachments/msg-1/000-")
    assert attachments.items[0]["scanStatus"] == "PENDING"
    assert attachments.items[0]["sha256"]

    parsed_payload = json_writes[0][0][2]
    assert parsed_payload["summary"]["subject"] == "Attachment test"
    assert parsed_payload["text"] == "Plain body\n"

    update = messages.updates[-1]
    assert update["ExpressionAttributeValues"][":ac"] == 1
    assert update["ExpressionAttributeValues"][":st"] == "PARSED"


def test_attachment_upload_failure_marks_message_failed(monkeypatch):
    from parse_email import main

    messages = FakeTable()

    def fail_upload(*args, **kwargs):
        raise RuntimeError("s3 unavailable")

    monkeypatch.setattr(main, "get_s3", lambda: FakeS3(_email_with_attachment()))
    monkeypatch.setattr(main, "MESSAGES", messages)
    monkeypatch.setattr(main, "s3_write_bytes", fail_upload)

    with pytest.raises(RuntimeError, match="attachment_upload_failed:note.txt"):
        main.handler(_event(), None)

    update = messages.updates[-1]
    assert update["ExpressionAttributeValues"][":st"] == "FAILED"
    assert update["ExpressionAttributeValues"][":err"] == "attachment_upload_failed:note.txt"
