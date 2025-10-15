import os
import time
import pytest
from unittest.mock import Mock, patch, MagicMock
from botocore.exceptions import ClientError


class TestLedgerHandler:

    def setup_method(self):
        os.environ['LEDGER_TABLE'] = 'test-ledger-table'
        os.environ['AWS_DEFAULT_REGION'] = 'eu-central-1'
        self.mock_context = Mock()

    def teardown_method(self):
        if 'LEDGER_TABLE' in os.environ:
            del os.environ['LEDGER_TABLE']

    @patch('init_ledger.main.TABLE')
    def test_handler_successful_first_write(self, mock_table):
        from init_ledger.main import handler

        input_event = {
            "bucket": "test-bucket",
            "key": "emails/123.eml",
            "sesMessageId": "ses-123"
        }

        mock_table.put_item.return_value = {}

        result = handler(input_event, self.mock_context)

        expected_item = {
            "messageId": "ses-123",
            "status": "PENDING",
            "createdAt": mock_table.put_item.call_args[1]['Item']['createdAt'],
            "updatedAt": mock_table.put_item.call_args[1]['Item']['updatedAt'],
            "bucket": "test-bucket",
            "key": "emails/123.eml"
        }

        mock_table.put_item.assert_called_once_with(
            Item=expected_item,
            ConditionExpression="attribute_not_exists(messageId)"
        )

        assert result["ok"] is True
        assert result["messageId"] == "ses-123"
        assert result["bucket"] == "test-bucket"
        assert result["key"] == "emails/123.eml"
        assert "idempotent" not in result

        call_item = mock_table.put_item.call_args[1]['Item']
        assert call_item["createdAt"] == call_item["updatedAt"]
        assert isinstance(call_item["createdAt"], int)

    @patch('init_ledger.main.TABLE')
    def test_handler_idempotent_duplicate_message(self, mock_table):
        from init_ledger.main import handler

        input_event = {
            "bucket": "test-bucket",
            "key": "emails/456.eml",
            "sesMessageId": "ses-456"
        }

        mock_table.put_item.side_effect = ClientError(
            {
                'Error': {
                    'Code': 'ConditionalCheckFailedException',
                    'Message': 'The conditional request failed'
                }
            },
            'PutItem'
        )

        result = handler(input_event, self.mock_context)

        assert result["ok"] is True
        assert result["idempotent"] is True
        assert result["messageId"] == "ses-456"
        assert result["bucket"] == "test-bucket"
        assert result["key"] == "emails/456.eml"

    @patch('init_ledger.main.TABLE')
    def test_handler_generates_message_id_from_key(self, mock_table):
        from init_ledger.main import handler

        input_event = {
            "bucket": "test-bucket",
            "key": "emails/message-789.eml"
        }

        mock_table.put_item.return_value = {}

        result = handler(input_event, self.mock_context)

        assert result["messageId"] == "message-789"
        mock_table.put_item.assert_called_once()

        call_item = mock_table.put_item.call_args[1]['Item']
        assert call_item["messageId"] == "message-789"

    @patch('init_ledger.main.TABLE')
    def test_handler_prefers_ses_message_id(self, mock_table):
        from init_ledger.main import handler

        input_event = {
            "bucket": "test-bucket",
            "key": "emails/from-key.eml",
            "sesMessageId": "from-ses"
        }

        mock_table.put_item.return_value = {}

        result = handler(input_event, self.mock_context)

        assert result["messageId"] == "from-ses"
        mock_table.put_item.assert_called_once()

        call_item = mock_table.put_item.call_args[1]['Item']
        assert call_item["messageId"] == "from-ses"

    @patch('init_ledger.main.TABLE')
    def test_handler_other_dynamodb_exception(self, mock_table):
        from init_ledger.main import handler


        input_event = {
            "bucket": "test-bucket",
            "key": "emails/error.eml",
            "sesMessageId": "error-msg"
        }

        mock_table.put_item.side_effect = ClientError(
            {
                'Error': {
                    'Code': 'ProvisionedThroughputExceededException',
                    'Message': 'Rate exceeded'
                }
            },
            'PutItem'
        )

        with pytest.raises(ClientError) as exc_info:
            handler(input_event, self.mock_context)

        assert exc_info.value.response['Error']['Code'] == 'ProvisionedThroughputExceededException'

    @patch('init_ledger.main.TABLE')
    def test_handler_complex_key_path(self, mock_table):
        from init_ledger.main import handler

        test_cases = [
            ("folder/subfolder/msg123.eml", "msg123"),
            ("deep/nested/path/message-456.eml", "message-456"),
            ("simple.eml", "simple"),
            ("no-extension", "no-extension"),  # No .eml extension
            ("multiple.dots.eml", "multiple.dots"),  # Multiple dots
        ]

        for key, expected_message_id in test_cases:
            mock_table.put_item.reset_mock()
            input_event = {"bucket": "test-bucket", "key": key}
            mock_table.put_item.return_value = {}

            result = handler(input_event, self.mock_context)

            assert result["messageId"] == expected_message_id
            call_item = mock_table.put_item.call_args[1]['Item']
            assert call_item["messageId"] == expected_message_id

    @patch('init_ledger.main.TABLE')
    @patch('init_ledger.main.time')
    def test_handler_uses_current_timestamp(self, mock_time, mock_table):
        from init_ledger.main import handler

        fixed_time = 1234567890
        mock_time.time.return_value = fixed_time

        input_event = {
            "bucket": "test-bucket",
            "key": "emails/msg999.eml"
        }
        mock_table.put_item.return_value = {}

        result = handler(input_event, self.mock_context)

        mock_time.time.assert_called_once()

        call_item = mock_table.put_item.call_args[1]['Item']
        assert call_item["createdAt"] == fixed_time
        assert call_item["updatedAt"] == fixed_time

    @patch('init_ledger.main.TABLE')
    def test_handler_preserves_original_event_data(self, mock_table):
        from init_ledger.main import handler

        input_event = {
            "bucket": "test-bucket",
            "key": "emails/msg111.eml",
            "sesMessageId": "ses-111",
            "otherField": "should-be-preserved",
            "nested": {"data": "also-preserved"}
        }

        mock_table.put_item.return_value = {}

        result = handler(input_event, self.mock_context)

        assert result["bucket"] == "test-bucket"
        assert result["key"] == "emails/msg111.eml"
        assert result["otherField"] == "should-be-preserved"
        assert result["nested"] == {"data": "also-preserved"}
        assert result["messageId"] == "ses-111"
        assert result["ok"] is True


# Run tests
if __name__ == "__main__":
    pytest.main([__file__, "-v"])