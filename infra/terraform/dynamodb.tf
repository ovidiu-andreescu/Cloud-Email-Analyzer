resource "aws_dynamodb_table" "ledger" {
  count        = local.is_local ? 0 : 1
  name         = local.messages_table_name
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
  count        = local.is_local ? 0 : 1
  name         = local.users_table_name
  billing_mode = "PAY_PER_REQUEST"

  hash_key = "userId"

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

resource "aws_dynamodb_table" "mailboxes" {
  count        = local.is_local ? 0 : 1
  name         = local.mailboxes_table_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "emailAddress"

  attribute {
    name = "emailAddress"
    type = "S"
  }

  tags = local.tags
}

resource "aws_dynamodb_table" "inbox" {
  count        = local.is_local ? 0 : 1
  name         = local.inbox_table_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "userId"
  range_key    = "sortKey"

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "sortKey"
    type = "S"
  }

  tags = local.tags
}

resource "aws_dynamodb_table" "attachments" {
  count        = local.is_local ? 0 : 1
  name         = local.attachments_table_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "messageId"
  range_key    = "attachmentId"

  attribute {
    name = "messageId"
    type = "S"
  }

  attribute {
    name = "attachmentId"
    type = "S"
  }

  tags = local.tags
}

resource "aws_dynamodb_table" "audit_log" {
  count        = local.is_local ? 0 : 1
  name         = local.audit_table_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "tenantId"
  range_key    = "sortKey"

  attribute {
    name = "tenantId"
    type = "S"
  }

  attribute {
    name = "sortKey"
    type = "S"
  }

  tags = local.tags
}
