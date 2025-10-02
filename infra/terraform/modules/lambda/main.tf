locals {
  is_image = var.package_type == "Image"
  local_file_hash = (var.filename != "" && !local.is_image) ? filebase64sha256(var.filename) : null
}

resource "aws_cloudwatch_log_group" "lg" {
  name              = "/aws/lambda/${var.function_name}"
  retention_in_days = var.log_retention
  tags              = var.tags
}

resource "aws_lambda_function" "this" {
  function_name = var.function_name
  role          = var.role_arn
  timeout       = var.timeout
  memory_size   = var.memory_size
  architectures = var.architectures
  layers        = var.layers
  publish       = var.publish
  tags          = var.tags

  package_type = var.package_type

  dynamic "image_config" {
    for_each = local.is_image ? [1] : []
    content {
      command     = length(var.image_cmd)   > 0 ? var.image_cmd   : null
      entry_point = length(var.image_entry) > 0 ? var.image_entry : null
      working_directory = var.image_workdir
    }
  }

  # Image mode
  image_uri = local.is_image ? var.image_uri : null

  # Zip mode
  runtime = local.is_image ? null : var.runtime
  handler = local.is_image ? null : var.handler

  filename         = (!local.is_image && var.filename != "") ? var.filename : null
  s3_bucket        = (!local.is_image && var.filename == "" && var.s3_bucket != "") ? var.s3_bucket : null
  s3_key           = (!local.is_image && var.filename == "" && var.s3_bucket != "") ? var.s3_key : null
  s3_object_version= (!local.is_image && var.filename == "" && var.s3_object_version != "") ? var.s3_object_version : null

  source_code_hash = local.is_image ? null : local.local_file_hash

  environment {
    variables = var.env_vars
  }

  depends_on = [aws_cloudwatch_log_group.lg]
}
