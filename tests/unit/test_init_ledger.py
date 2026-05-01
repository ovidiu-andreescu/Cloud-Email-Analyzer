from pathlib import Path
import sys

import pytest
from botocore.exceptions import ClientError

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "services/init_ledger/src"))
sys.path.insert(0, str(ROOT / "libs/common/src"))


class FakeTable:
    def __init__(self):
        self.puts = []
        self.side_effect = None

    def put_item(self, **kwargs):
        if self.side_effect:
            raise self.side_effect
        self.puts.append(kwargs)
        return {}


def _event():
    return {
        "tenantId": "demo",
        "messageId": "msg-1",
        "receivedAt": "2026-05-01T12:00:00Z",
        "source": "local-seed",
        "raw": {"bucket": "raw-bucket", "key": "raw/msg-1.eml"},
        "envelope": {
            "mailFrom": "sender@example.com",
            "recipients": ["alice@demo.local"],
        },
        "headers": {"subject": "Canonical event", "from": "sender@example.com"},
    }


def test_handler_creates_message_from_canonical_event(monkeypatch):
    from init_ledger import main

    table = FakeTable()
    monkeypatch.setattr(main, "TABLE", table)

    result = main.handler(_event(), None)

    item = table.puts[0]["Item"]
    assert item["messageId"] == "msg-1"
    assert item["status"] == "RECEIVED"
    assert item["rawBucket"] == "raw-bucket"
    assert item["rawKey"] == "raw/msg-1.eml"
    assert item["mlVerdict"] == "PENDING"
    assert item["virusVerdict"] == "PENDING"
    assert item["finalVerdict"] == "PENDING"
    assert result["ledger"] == {"ok": True, "messageId": "msg-1"}


def test_handler_treats_duplicate_message_as_idempotent(monkeypatch):
    from init_ledger import main

    table = FakeTable()
    table.side_effect = ClientError(
        {"Error": {"Code": "ConditionalCheckFailedException", "Message": "duplicate"}},
        "PutItem",
    )
    monkeypatch.setattr(main, "TABLE", table)

    result = main.handler(_event(), None)

    assert result["ledger"] == {"ok": True, "messageId": "msg-1"}


def test_handler_raises_non_idempotent_dynamodb_error(monkeypatch):
    from init_ledger import main

    table = FakeTable()
    table.side_effect = ClientError(
        {"Error": {"Code": "ProvisionedThroughputExceededException", "Message": "throttled"}},
        "PutItem",
    )
    monkeypatch.setattr(main, "TABLE", table)

    with pytest.raises(ClientError):
        main.handler(_event(), None)
