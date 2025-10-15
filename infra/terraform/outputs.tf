output "inbound_bucket" {
  value = aws_s3_bucket.inbound.bucket
}

output "ecr_repositories" {
  value = { for k, v in aws_ecr_repository.lambda : k => v.repository_url }
}

output "ses_domain_identity_arn" {
  value       = try(aws_ses_domain_identity.this[0].arn, null)
  description = "Null in local_dev or when domain_name is empty."
}

output "ledger_table_name"           {
  value = aws_dynamodb_table.ledger.name
}

output "init_ledger_name"            {
  value = aws_lambda_function.init_ledger.function_name
}

output "parse_email_name"            {
  value = aws_lambda_function.parse_email.function_name
}

output "extract_attachments_name"    {
  value = aws_lambda_function.extract_attachments.function_name
}
