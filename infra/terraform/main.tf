terraform {
  required_version = ">= 1.6.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
    random = {
      source = "hashicorp/random"
    }
  }
}

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

