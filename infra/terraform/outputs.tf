output "inbound_bucket" {
  value = aws_s3_bucket.inbound.bucket
}

output "bucket_name" {
  value = aws_s3_bucket.inbound.id
}

output "eventbridge_rule_name" {
  value = aws_cloudwatch_event_rule.s3_new_email.name
}

output "ecr_repositories" {
  value = { for k, v in aws_ecr_repository.lambda : k => v.repository_url }
}

output "ses_domain_identity_arn" {
  value       = try(aws_ses_domain_identity.this[0].arn, null)
  description = "Null in local_dev or when domain_name is empty."
}

output "ledger_table_name" {
  value = local.messages_table_name
}

output "messages_table_name" {
  value = local.messages_table_name
}

output "users_table_name" {
  value = local.users_table_name
}

output "mailboxes_table_name" {
  value = local.mailboxes_table_name
}

output "inbox_table_name" {
  value = local.inbox_table_name
}

output "attachments_table_name" {
  value = local.attachments_table_name
}

output "event_bus_name" {
  value = aws_cloudwatch_event_bus.mail.name
}

output "state_machine_arn" {
  value = local.state_machine_arn
}

output "init_ledger_name" {
  value = aws_lambda_function.init_ledger.function_name
}

output "parse_email_name" {
  value = aws_lambda_function.parse_email.function_name
}

output "api_endpoint" {
  description = "The invoke URL for the FastAPI HTTP API."
  value       = try(aws_apigatewayv2_stage.default[0].invoke_url, null)
}

output "frontend_bucket_name" {
  value = try(aws_s3_bucket.frontend[0].bucket, null)
}

output "frontend_url" {
  description = "The URL for the frontend S3 static website."
  value       = try(aws_s3_bucket.frontend[0].website_endpoint, null)
}
