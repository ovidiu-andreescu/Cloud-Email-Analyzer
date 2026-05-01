from pathlib import Path
import sys

import pytest
from fastapi import HTTPException

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "services/web_server/src"))
sys.path.insert(0, str(ROOT / "libs/common/src"))

from app.routers import messages


class FakeTable:
    def __init__(self, items):
        self.items = items

    def get_item(self, Key):
        return {"Item": self.items.get(tuple(sorted(Key.items())))}


class FakePagedQueryTable:
    def __init__(self, pages):
        self.pages = pages
        self.calls = []

    def query(self, **kwargs):
        self.calls.append(kwargs)
        page_index = kwargs.get("ExclusiveStartKey", {}).get("page", 0)
        response = {"Items": self.pages[page_index]}
        if page_index + 1 < len(self.pages):
            response["LastEvaluatedKey"] = {"page": page_index + 1}
        return response


class FakeScanFailureTable:
    def scan(self, **kwargs):
        raise RuntimeError("table unavailable")


def _key(**kwargs):
    return tuple(sorted(kwargs.items()))


def test_download_attachment_streams_authorized_artifact(monkeypatch):
    message = {
        "messageId": "msg-1",
        "ownerUserIds": ["USER#alice"],
    }
    attachment = {
        "messageId": "msg-1",
        "attachmentId": "att-1",
        "filename": 'report".txt',
        "contentType": "text/plain",
        "s3Bucket": "artifacts",
        "s3Key": "attachments/msg-1/report.txt",
        "scanVerdict": "SAFE",
        "scanStatus": "SCANNED",
    }
    tables = {
        "MESSAGES_TABLE": FakeTable({_key(messageId="msg-1"): message}),
        "ATTACHMENTS_TABLE": FakeTable({_key(messageId="msg-1", attachmentId="att-1"): attachment}),
    }

    monkeypatch.setattr(messages, "get_table", lambda name: tables[name])
    monkeypatch.setattr(messages, "s3_read", lambda bucket, key: b"attachment-bytes")

    response = messages.download_attachment(
        "msg-1",
        "att-1",
        user={"sub": "USER#alice", "role": "user"},
    )

    assert response.body == b"attachment-bytes"
    assert response.media_type == "text/plain"
    assert 'filename="report_.txt"' in response.headers["content-disposition"]
    assert response.headers["x-scan-verdict"] == "SAFE"


def test_download_attachment_rejects_unauthorized_user(monkeypatch):
    tables = {
        "MESSAGES_TABLE": FakeTable({_key(messageId="msg-1"): {"messageId": "msg-1", "ownerUserIds": ["USER#alice"]}}),
        "ATTACHMENTS_TABLE": FakeTable({}),
    }

    monkeypatch.setattr(messages, "get_table", lambda name: tables[name])

    with pytest.raises(HTTPException) as exc:
        messages.download_attachment(
            "msg-1",
            "att-1",
            user={"sub": "USER#bob", "role": "user"},
        )

    assert exc.value.status_code == 403


def test_download_attachment_returns_404_for_missing_attachment(monkeypatch):
    tables = {
        "MESSAGES_TABLE": FakeTable({_key(messageId="msg-1"): {"messageId": "msg-1", "ownerUserIds": ["USER#alice"]}}),
        "ATTACHMENTS_TABLE": FakeTable({}),
    }

    monkeypatch.setattr(messages, "get_table", lambda name: tables[name])

    with pytest.raises(HTTPException) as exc:
        messages.download_attachment(
            "msg-1",
            "att-1",
            user={"sub": "USER#alice", "role": "user"},
        )

    assert exc.value.status_code == 404


def test_list_messages_reads_all_inbox_pages(monkeypatch):
    inbox_table = FakePagedQueryTable([
        [{"userId": "USER#alice", "sortKey": "2026-01-01#msg-1", "messageId": "msg-1"}],
        [{"userId": "USER#alice", "sortKey": "2026-01-02#msg-2", "messageId": "msg-2"}],
    ])
    message_table = FakeTable({
        _key(messageId="msg-1"): {
            "messageId": "msg-1",
            "subject": "First",
            "ownerUserIds": ["USER#alice"],
            "receivedAt": "2026-01-01T00:00:00Z",
        },
        _key(messageId="msg-2"): {
            "messageId": "msg-2",
            "subject": "Second",
            "ownerUserIds": ["USER#alice"],
            "receivedAt": "2026-01-02T00:00:00Z",
        },
    })
    tables = {
        "INBOX_TABLE": inbox_table,
        "MESSAGES_TABLE": message_table,
    }

    monkeypatch.setattr(messages, "get_table", lambda name: tables[name])

    response = messages.list_messages(
        limit=10,
        user={"sub": "USER#alice", "role": "user"},
    )

    assert [item["messageId"] for item in response["items"]] == ["msg-2", "msg-1"]
    assert response["total"] == 2
    assert len(inbox_table.calls) == 2
    assert inbox_table.calls[1]["ExclusiveStartKey"] == {"page": 1}


def test_list_attachments_reads_all_pages(monkeypatch):
    tables = {
        "MESSAGES_TABLE": FakeTable({_key(messageId="msg-1"): {"messageId": "msg-1", "ownerUserIds": ["USER#alice"]}}),
        "ATTACHMENTS_TABLE": FakePagedQueryTable([
            [{"messageId": "msg-1", "attachmentId": "att-1"}],
            [{"messageId": "msg-1", "attachmentId": "att-2"}],
        ]),
    }

    monkeypatch.setattr(messages, "get_table", lambda name: tables[name])

    response = messages.list_attachments(
        "msg-1",
        user={"sub": "USER#alice", "role": "user"},
    )

    assert [item["attachmentId"] for item in response["items"]] == ["att-1", "att-2"]
    assert len(tables["ATTACHMENTS_TABLE"].calls) == 2


def test_audit_log_surfaces_table_failures(monkeypatch):
    monkeypatch.setattr(messages, "get_table", lambda name: FakeScanFailureTable())

    with pytest.raises(HTTPException) as exc:
        messages.audit_log(user={"sub": "USER#admin", "role": "admin"})

    assert exc.value.status_code == 503
    assert exc.value.detail == "audit_log_unavailable"
