# tests/unit/test_parse_email.py
import os
import pytest
from unittest.mock import patch, MagicMock
from email.message import EmailMessage


class TestParseEmailHandler:
    def setup_method(self):
        if "OUT_PREFIX" in os.environ:
            del os.environ["OUT_PREFIX"]

    def teardown_method(self):
        if "OUT_PREFIX" in os.environ:
            del os.environ["OUT_PREFIX"]

    def _plain_email(self, subject="Hello", sender="a@ex.com", to="b@ex.com", body="plain text body"):
        msg = EmailMessage()
        msg["Subject"] = subject
        msg["From"] = sender
        msg["To"] = to
        msg.set_content(body)  # text/plain
        return msg

    def _html_email(self, subject="Hi", sender="a@ex.com", to="b@ex.com", text="text part", html="<b>hi</b>"):
        msg = EmailMessage()
        msg["Subject"] = subject
        msg["From"] = sender
        msg["To"] = to
        msg.set_content(text)
        msg.add_alternative(html, subtype="html")
        return msg

    def _email_with_attachment(self, subject="Attach", sender="a@ex.com", to="b@ex.com"):
        msg = EmailMessage()
        msg["Subject"] = subject
        msg["From"] = sender
        msg["To"] = to
        msg.set_content("body")
        msg.add_attachment(b"malware-bytes", maintype="application", subtype="octet-stream", filename="evil.exe")
        return msg

    @patch("parse_email.main.s3_write")
    @patch("parse_email.main.mail_extract")
    def test_handler_plain_text_email_writes_summary_and_updates_event(self, mock_extract, mock_s3_write):
        from parse_email.main import handler

        msg = self._plain_email(body="hello world")
        mock_extract.return_value = ("msg-1", msg, "inbox-bucket", "emails/1.eml")

        input_event = {"bucket": "ignored", "key": "ignored"}
        result = handler(input_event, MagicMock())

        expected_key = "parsed/msg-1.json"
        mock_s3_write.assert_called_once()
        call_args = mock_s3_write.call_args
        assert call_args.args[0] == "inbox-bucket"
        assert call_args.args[1] == expected_key
        payload = call_args.args[2]
        assert "headers" in payload and "summary" in payload
        assert payload["summary"]["messageId"] == "msg-1"
        assert payload["summary"]["hasHtml"] is False
        assert payload["summary"]["textPreview"].startswith("hello world")
        assert call_args.kwargs.get("metadata") == {"messageId": "msg-1"}

        # event enriched
        assert result["artifacts"]["parsed"] == {"bucket": "inbox-bucket", "key": expected_key}
        assert result["mail"] == {"subject": msg["Subject"], "from": msg["From"], "to": msg["To"]}
        assert result["maybeHasAttachments"] is False

    @patch("parse_email.main.s3_write")
    @patch("parse_email.main.mail_extract")
    def test_handler_multipart_html_detects_has_html(self, mock_extract, mock_s3_write):
        from parse_email.main import handler

        msg = self._html_email(text="hello", html="<b>hi</b>")
        mock_extract.return_value = ("msg-2", msg, "inbox-bucket", "emails/2.eml")

        result = handler({"bucket": "ignored", "key": "ignored"}, MagicMock())
        payload = mock_s3_write.call_args.args[2]
        assert payload["summary"]["hasHtml"] is True
        assert payload["summary"]["textPreview"].startswith("hello")
        assert result["maybeHasAttachments"] is False

    @patch("parse_email.main.s3_write")
    @patch("parse_email.main.mail_extract")
    def test_handler_detects_attachments_sets_flag_true(self, mock_extract, mock_s3_write):
        from parse_email.main import handler

        msg = self._email_with_attachment()
        mock_extract.return_value = ("msg-3", msg, "inbox-bucket", "emails/3.eml")

        result = handler({"bucket": "ignored", "key": "ignored"}, MagicMock())
        assert result["maybeHasAttachments"] is True

    @patch("parse_email.main.s3_write")
    @patch("parse_email.main.mail_extract")
    def test_handler_respects_custom_out_prefix_env(self, mock_extract, mock_s3_write):
        from parse_email.main import handler

        os.environ["OUT_PREFIX"] = "custom-prefix/"
        msg = self._plain_email()
        mock_extract.return_value = ("xyz", msg, "inbox-bucket", "emails/x.eml")

        handler({"bucket": "ignored", "key": "ignored"}, MagicMock())
        assert mock_s3_write.call_args.args[1] == "custom-prefix/xyz.json"

    @patch("parse_email.main.s3_write")
    @patch("parse_email.main.mail_extract")
    def test_handler_text_preview_truncates_to_1000(self, mock_extract, mock_s3_write):
        from parse_email.main import handler

        long_text = "A" * 2000
        msg = self._plain_email(body=long_text)
        mock_extract.return_value = ("truncate-1", msg, "inbox-bucket", "emails/t.eml")

        handler({"bucket": "ignored", "key": "ignored"}, MagicMock())
        preview = mock_s3_write.call_args.args[2]["summary"]["textPreview"]
        assert len(preview) == 1000
        assert preview == "A" * 1000
