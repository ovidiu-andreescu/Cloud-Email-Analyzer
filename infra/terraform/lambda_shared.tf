resource "aws_cloudwatch_log_group" "lambda" {
  for_each          = toset(["init_ledger", "parse_email", "extract_attachments"])
  name              = "/aws/lambda/${local.base_prefix}-${each.value}"
  retention_in_days = 14
}

resource "aws_lambda_function" "init_ledger" {
  function_name = "${local.base_prefix}-init-ledger"
  role          = aws_iam_role.init_ledger.arn
  package_type  = "Image"
  image_uri     = var.init_ledger_image_uri
  timeout       = 300
  memory_size   = 1024
  environment {
    variables = {
      LEDGER_TABLE = aws_dynamodb_table.ledger.name
      STAGE        = var.env
    }
  }
  depends_on = [aws_cloudwatch_log_group.lambda]
  tags = local.tags
}

resource "aws_lambda_function" "parse_email" {
  function_name = "${local.base_prefix}-parse-email"
  role          = aws_iam_role.parse_email.arn
  package_type  = "Image"
  image_uri     = var.parse_email_image_uri
  timeout       = 300
  memory_size   = 1024
  environment {
    variables = {
      OUT_PREFIX = local.parsed_prefix
      STAGE      = var.env
    }
  }
  depends_on = [aws_cloudwatch_log_group.lambda]
  tags = local.tags
}

resource "aws_lambda_function" "extract_attachments" {
  function_name = "${local.base_prefix}-extract-attachments"
  role          = aws_iam_role.extract_attachments.arn
  package_type  = "Image"
  image_uri     = var.extract_attachments_image_uri
  timeout       = 300
  memory_size   = 1024
  environment {
    variables = {
      ATTACH_PREFIX = local.attach_prefix
      STAGE         = var.env
    }
  }
  depends_on = [aws_cloudwatch_log_group.lambda]
  tags = local.tags
}
