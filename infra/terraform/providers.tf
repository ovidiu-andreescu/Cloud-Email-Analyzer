provider "aws" {
  region                      = var.region
  access_key                  = local.is_local ? "test" : null
  secret_key                  = local.is_local ? "test" : null
  s3_use_path_style           = local.is_local
  skip_credentials_validation = local.is_local
  skip_metadata_api_check     = local.is_local
  skip_requesting_account_id  = local.is_local

  endpoints {
    apigateway     = local.is_local ? var.localstack_endpoint : null
    apigatewayv2   = local.is_local ? var.localstack_endpoint : null
    cloudwatchlogs = local.is_local ? var.localstack_endpoint : null
    dynamodb       = local.is_local ? var.localstack_endpoint : null
    ecr            = local.is_local ? var.localstack_endpoint : null
    events         = local.is_local ? var.localstack_endpoint : null
    iam            = local.is_local ? var.localstack_endpoint : null
    lambda         = local.is_local ? var.localstack_endpoint : null
    s3             = local.is_local ? var.localstack_endpoint : null
    sfn            = local.is_local ? var.localstack_endpoint : null
    sts            = local.is_local ? var.localstack_endpoint : null
  }
}
