resource "aws_cloudwatch_log_group" "lambda" {
  for_each          = toset(["init_ledger", "parse_email", "extract_attachments", "web-server"])
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
      ATTACH_PREFIX = local.attach_prefix
      LEDGER_TABLE = aws_dynamodb_table.ledger.name
      STAGE      = var.env
    }
  }
  depends_on = [aws_cloudwatch_log_group.lambda]
  tags = local.tags
}

resource "aws_lambda_permission" "allow_sfn_init_ledger" {
  statement_id  = "AllowExecutionFromStepFunctions"
  action        = "lambda:InvokeFunction"
  principal     = "states.amazonaws.com"
  function_name = aws_lambda_function.init_ledger.function_name
  # optional: qualify with source-arn to limit to this state machine once it exists
  # source_arn = aws_sfn_state_machine.email_pipeline[0].arn
}

resource "aws_lambda_permission" "allow_sfn_parse_email" {
  statement_id  = "AllowExecutionFromStepFunctions"
  action        = "lambda:InvokeFunction"
  principal     = "states.amazonaws.com"
  function_name = aws_lambda_function.parse_email.function_name
  # optional: qualify with source-arn to limit to this state machine once it exists
  # source_arn = aws_sfn_state_machine.email_pipeline[0].arn
}

# decide at runtime if we create the lambda
locals {
  create_web_server_lambda = var.web_server_image_uri != "" ? true : false
}

# attach basic exec if you didn't yet
resource "aws_iam_role_policy_attachment" "api_lambda_basic" {
  role       = aws_iam_role.api_lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_lambda_function" "api_server" {
  count = local.create_web_server_lambda ? 1 : 0

  function_name = "${local.base_prefix}-web-server"
  role          = aws_iam_role.api_lambda_role.arn
  package_type  = "Image"
  image_uri     = var.web_server_image_uri
  timeout       = 30
  memory_size   = 512

  environment {
    variables = {
      LEDGER_TABLE      = aws_dynamodb_table.ledger.name
      USERS_TABLE       = aws_dynamodb_table.user.name
      USER_ACTIVITY_GSI = "by-activity-gsi"
      USER_GSI_PK_VALUE = "USERS"
      STAGE             = var.env
    }
  }
  depends_on = [aws_cloudwatch_log_group.lambda]

  tags = local.tags
}