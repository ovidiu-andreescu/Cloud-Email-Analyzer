import os
import importlib
import pytest
from unittest.mock import patch, MagicMock
from email.message import EmailMessage


class TestExtractAttachmentsHandler:
    def setup_method(self):
        if "ATTACH_PREFIX" in os.environ:
            del os.environ["ATTACH_PREFIX"]

    def teardown_method(self):
        if "ATTACH_PREFIX" in os.environ:
            del os.environ["ATTACH_PREFIX"]

    def _email_no_attachments(self, subject="No att", sender="a@ex.com", to="b@ex.com"):
        msg = EmailMessage()
        msg["Subject"] = subject
        msg["From"] = sender
        msg["To"] = to
        msg.set_content("just text")
        return msg

    def _email_with_attachments(self, files):
        msg = EmailMessage()
        msg["Subject"] = "With atts"
        msg["From"] = "a@ex.com"
        msg["To"] = "b@ex.com"
        msg.set_content("body")
        for fname, data in files:
            msg.add_attachment(
                data,
                maintype="application",
                subtype="octet-stream",
                filename=fname,
            )
        return msg

    @patch("extract_attachments.main.s3_write")
    @patch("extract_attachments.main.mail_extract")
    def test_no_attachments_sets_flag_and_writes_nothing(self, mock_extract, mock_s3_write):
        from extract_attachments.main import handler

        msg = self._email_no_attachments()
        mock_extract.return_value = ("m1", msg, "inbox-bucket", "emails/1.eml")

        result = handler({"bucket": "ignored", "key": "ignored"}, MagicMock())

        mock_s3_write.assert_not_called()
        assert result["hasAttachments"] is False
        assert result["artifacts"]["attachments"] == []

    @patch("extract_attachments.main.s3_write")
    @patch("extract_attachments.main.mail_extract")
    def test_saves_multiple_attachments_and_artifacts(self, mock_extract, mock_s3_write):
        from extract_attachments.main import handler

        files = [("a.txt", b"hello"), ("b.bin", b"\x00\x01")]
        msg = self._email_with_attachments(files)
        mock_extract.return_value = ("msg-2", msg, "inbox-bucket", "emails/2.eml")

        result = handler({"bucket": "ignored", "key": "ignored"}, MagicMock())

        assert mock_s3_write.call_count == 2

        (bucket0, key0, data0, *rest0), kwargs0 = mock_s3_write.call_args_list[0]
        assert bucket0 == "inbox-bucket"
        assert key0 == "attachments/msg-2/a.txt"
        assert data0 == b"hello"
        assert kwargs0.get("metadata") == {"messageId": "msg-2"}

        (bucket1, key1, data1, *rest1), kwargs1 = mock_s3_write.call_args_list[1]
        assert key1 == "attachments/msg-2/b.bin"
        assert data1 == b"\x00\x01"
        assert kwargs1.get("metadata") == {"messageId": "msg-2"}

        atts = result["artifacts"]["attachments"]
        assert result["hasAttachments"] is True
        assert len(atts) == 2
        assert atts[0] == {
            "bucket": "inbox-bucket",
            "key": "attachments/msg-2/a.txt",
            "filename": "a.txt",
            "size": 5,
        }

    @patch("extract_attachments.main.s3_write")
    @patch("extract_attachments.main.mail_extract")
    def test_url_encodes_filenames(self, mock_extract, mock_s3_write):
        from extract_attachments.main import handler

        files = [("weird name (1).pdf", b"x")]
        msg = self._email_with_attachments(files)
        mock_extract.return_value = ("m3", msg, "b", "k")

        handler({"bucket": "ignored", "key": "ignored"}, MagicMock())
        # " " -> %20, "(" -> %28, ")" -> %29
        written_key = mock_s3_write.call_args.args[1]
        assert written_key == "attachments/m3/weird%20name%20%281%29.pdf"

    @patch("extract_attachments.main.s3_write")
    @patch("extract_attachments.main.mail_extract")
    def test_empty_payload_size_zero(self, mock_extract, mock_s3_write):
        from extract_attachments.main import handler

        files = [("empty.bin", b"")]
        msg = self._email_with_attachments(files)
        mock_extract.return_value = ("m4", msg, "bucket", "k")

        result = handler({"bucket": "ignored", "key": "ignored"}, MagicMock())
        saved = result["artifacts"]["attachments"]
        assert saved[0]["size"] == 0

    def test_respects_custom_attach_prefix_env(self, monkeypatch):
        import extract_attachments.main as main

        monkeypatch.setenv("ATTACH_PREFIX", "custom-prefix/")
        importlib.reload(main)

        with patch.object(main, "mail_extract") as mock_extract, patch.object(main, "s3_write") as mock_s3_write:
            msg = self._email_with_attachments([("note.txt", b"x")])
            mock_extract.return_value = ("xyz", msg, "inbox-bucket", "emails/x.eml")

            main.handler({"bucket": "ignored", "key": "ignored"}, MagicMock())
            written_key = mock_s3_write.call_args.args[1]
            assert written_key == "custom-prefix/xyz/note.txt"
