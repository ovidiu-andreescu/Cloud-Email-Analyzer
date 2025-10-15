resource "aws_dynamodb_table" "ledger" {
  name         = "${local.base_prefix}-ledger"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "messageId"

  attribute {
    name = "messageId"
    type = "S"
  }

  tags = local.tags

  lifecycle {
    ignore_changes = [
      ttl, point_in_time_recovery
    ]
  }
}
