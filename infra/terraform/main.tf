terraform {
  required_version = ">= 1.6.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }
}

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

locals {
  base_prefix   = "${var.project}-${var.env}"
  package_type  = var.env == "local-dev" ? "Zip" : "Image"
  lambda_names  = { for name, _ in var.lambda_defs : name => "${local.base_prefix}-${name}" }
}
