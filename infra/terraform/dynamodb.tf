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

resource "aws_dynamodb_table" "user" {
  name         = "${local.base_prefix}-user" # This is your USERS_TABLE_NAME
  billing_mode = "PAY_PER_REQUEST"

  hash_key     = "userId"

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "gsi_pk"
    type = "S"
  }

  attribute {
    name = "last_active_at"
    type = "S"
  }

  global_secondary_index {
    name            = "by-activity-gsi"
    hash_key        = "gsi_pk"
    range_key       = "last_active_at"
    projection_type = "ALL"
  }

  tags = local.tags

  lifecycle {
    ignore_changes = [
      ttl, point_in_time_recovery
    ]
  }
}
