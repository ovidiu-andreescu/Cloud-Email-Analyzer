variable "project" {
  type = string
}

variable "env" {
  type = string
}

variable "region" {
  type = string
}

variable "tenant_id" {
  type    = string
  default = "demo"
}

variable "localstack_endpoint" {
  type    = string
  default = ""
}

variable "domain_name" {
  description = "Root domain managed in Route53 for SES inbound (dev/prod)."
  type        = string
  default     = ""
}
variable "tags" {
  type    = map(string)
  default = {}
}

# Lambda definitions: one object per function
# Only image mode supported
variable "lambda_defs" {
  type = map(object({
    image_uri = optional(string)
    image_tag = optional(string)
    env_vars  = optional(map(string), {})
    timeout   = optional(number, 30)
    memory_mb = optional(number, 256)
  }))
  default = {}
}

variable "kms_key_arn" {
  description = "The ARN of the KMS key for encrypting resources."
  type        = string
  default     = null
}

variable "init_ledger_image_uri" {
  type    = string
  default = ""
}

variable "parse_email_image_uri" {
  type    = string
  default = ""
}

variable "resolve_recipients_image_uri" {
  type    = string
  default = ""
}

variable "phishing_ml_image_uri" {
  type    = string
  default = ""
}

variable "attachment_scan_image_uri" {
  type    = string
  default = ""
}

variable "aggregate_verdicts_image_uri" {
  type    = string
  default = ""
}

variable "web_server_image_uri" {
  type    = string
  default = ""
}

variable "extract_attachments_image_uri" {
  type    = string
  default = ""
}

variable "bucket_name" {
  type    = string
  default = null
}

variable "aws_account_id" {
  type    = string
  default = ""
}

variable "users_table_name" {
  description = "The name of the *existing* DynamoDB users table."
  type        = string
  default     = ""
}
