output "inbound_bucket" {
  value = aws_s3_bucket.inbound.bucket
}

output "ecr_repositories" {
  value = { for k, v in aws_ecr_repository.lambda : k => v.repository_url }
}

output "lambda_arns" {
  value = { for k, v in aws_lambda_function.fn : k => v.arn }
}

output "ses_domain_identity_arn" {
  value       = try(aws_ses_domain_identity.this[0].arn, null)
  description = "Null in local_dev or when domain_name is empty."
}
