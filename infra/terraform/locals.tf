locals {
  base_prefix   = "${var.project}-${var.env}"
  lambda_names  = { for name, _ in var.lambda_defs : name => "${local.base_prefix}-${name}" }
  enable_ses = var.env != "local-dev" && var.domain_name != ""

  bucket_name = coalesce(var.bucket_name, "${local.base_prefix}-inbound")

  inbound_prefix = "emails/"
  parsed_prefix  = "parsed/"
  attach_prefix  = "attachments/"

  account_id = data.aws_caller_identity.current.account_id

  api_gateway_name = "http-api"

  tags = {
    Project = var.project
    Env     = var.env
  }
}
