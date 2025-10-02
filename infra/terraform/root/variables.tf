variable "project" {
  description = "The name of the project terraform applies to"
  type        = string
}

variable "region" {
  description = "The AWS region where resources will be created."
  type        = string
  default     = "eu-central-1"
}

variable "env" {
  description = "The environment the code will run in"
  type        = string
}

variable "prefix"  {
  description = "A prefix to add to all resource names (e.g., 'dev', 'prod')."
  type = string
  default = ""
}

variable "secrets" {
  description = "A map of secret names to their values for AWS Secrets Manager."
  type        = map(string)
  sensitive   = true
  default     = {}
}

variable "tags" {
  description = "Optional tags to apply to all resources."
  type        = map(string)
  default     = {}
}

variable "lambda_defs" {
  type = map(object({
    image_uri = optional(string, "")  # full ECR URI incl. tag or digest, e.g. ".../repo:tag"
    image_tag = optional(string, "")  # optional: just the tag; we build URI as repo_url:tag

    runtime  = optional(string, "python3.11")
    handler  = optional(string, "app.handler")
    filename = optional(string, "")        # local zip path
    s3_bucket = optional(string, "")       # alternative: fetch code from S3
    s3_key    = optional(string, "")
    s3_object_version = optional(string, "")

    memory_size   = optional(number, 512)
    timeout       = optional(number, 30)
    architectures = optional(list(string), ["x86_64"]) # or ["arm64"]
    env_vars      = optional(map(string), {})
    layers        = optional(list(string), [])
    publish       = optional(bool, false)
  }))
  default = {}
}