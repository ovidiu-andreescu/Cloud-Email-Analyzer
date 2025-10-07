variable "project"    {
  type = string
}

variable "env"        {
  type = string
}

variable "region"     {
  type = string
}

variable "domain_name"{
  description = "Root domain managed in Route53 for SES inbound (dev/prod)."
  type        = string
  default     = ""
}
variable "tags"       {
  type = map(string)
  default = {}
}

# Lambda definitions: one object per function
# Example entry (zip):
# email_processor = { runtime="python3.11", handler="app.handler", filename="artifacts/email_processor.zip", env_vars={STAGE="dev"}, timeout=60, memory_mb=512 }
# Or (image): { image_tag="v0.1.0", env_vars={...}, timeout=60, memory_mb=512 }
variable "lambda_defs" {
  type = map(object({
    # Zip mode fields
    runtime    = optional(string)
    handler    = optional(string)
    filename   = optional(string)
    # Image mode fields
    image_uri  = optional(string)
    image_tag  = optional(string)
    # Shared
    env_vars   = optional(map(string), {})
    timeout    = optional(number, 30)
    memory_mb  = optional(number, 256)
  }))
  default = {}
}

variable "kms_key_arn" {
  description = "The ARN of the KMS key for encrypting resources."
  type        = string
  default     = null
}