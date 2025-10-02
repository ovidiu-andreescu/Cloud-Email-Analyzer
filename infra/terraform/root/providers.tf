terraform {
  required_version = "~> 1.10.0"
  required_providers {
    aws = {
      source = "hashicorp/aws"
      version = "~> 5.60"
    }
  }
}

locals {
  is_local = var.env == "local_dev"
}


provider "aws" {
  region                      = var.region
  skip_credentials_validation = local.is_local
  s3_use_path_style           = local.is_local
  access_key                  = local.is_local ? "test" : null
  secret_key                  = local.is_local ? "test" : null


dynamic "endpoints" {
  for_each = local.is_local ? [1] : []
  content {
    apigateway   = "http://localstack:4566"
    cloudwatchlogs = "http://localstack:4566"
    dynamodb     = "http://localstack:4566"
    iam          = "http://localstack:4566"
    lambda       = "http://localstack:4566"
    s3           = "http://localstack:4566"
    sns          = "http://localstack:4566"
    sqs          = "http://localstack:4566"
    sts          = "http://localstack:4566"
    events       = "http://localstack:4566"
  }
}

}