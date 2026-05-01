locals {
  base_prefix             = "${var.project}-${var.env}"
  lambda_names            = { for name, _ in var.lambda_defs : name => "${local.base_prefix}-${name}" }
  is_local                = var.env == "local-dev"
  enable_ses              = var.env != "local-dev" && var.domain_name != ""
  enable_frontend_hosting = !local.is_local

  bucket_name            = coalesce(var.bucket_name, "${local.base_prefix}-inbound")
  artifacts_bucket_name  = "${local.base_prefix}-artifacts"
  event_bus_name         = "${local.base_prefix}-mail-events"
  state_machine_name     = "${local.base_prefix}-email-pipeline"
  state_machine_arn      = "arn:aws:states:${var.region}:${local.account_id}:stateMachine:${local.state_machine_name}"
  messages_table_name    = "${local.base_prefix}-messages"
  users_table_name       = "${local.base_prefix}-users"
  mailboxes_table_name   = "${local.base_prefix}-mailboxes"
  inbox_table_name       = "${local.base_prefix}-inbox-messages"
  attachments_table_name = "${local.base_prefix}-attachments"

  inbound_prefix = "emails/"
  parsed_prefix  = "parsed/"
  attach_prefix  = "attachments/"

  account_id            = data.aws_caller_identity.current.account_id
  dynamodb_arn_prefix   = "arn:aws:dynamodb:${var.region}:${local.account_id}:table"
  messages_table_arn    = "${local.dynamodb_arn_prefix}/${local.messages_table_name}"
  users_table_arn       = "${local.dynamodb_arn_prefix}/${local.users_table_name}"
  mailboxes_table_arn   = "${local.dynamodb_arn_prefix}/${local.mailboxes_table_name}"
  inbox_table_arn       = "${local.dynamodb_arn_prefix}/${local.inbox_table_name}"
  attachments_table_arn = "${local.dynamodb_arn_prefix}/${local.attachments_table_name}"

  api_gateway_name = "http-api"

  tags = {
    Project = var.project
    Env     = var.env
  }
}
