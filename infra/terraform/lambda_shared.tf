locals {
  lambda_zip_dir = "${path.module}/../../.localstack-build/lambdas"
  lambda_zip_files = {
    init_ledger        = "${local.lambda_zip_dir}/init-ledger.zip"
    resolve_recipients = "${local.lambda_zip_dir}/resolve-recipients.zip"
    parse_email        = "${local.lambda_zip_dir}/parse-email.zip"
    phishing_ml        = "${local.lambda_zip_dir}/phishing-ml.zip"
    attachment_scan    = "${local.lambda_zip_dir}/attachment-scan.zip"
    aggregate_verdicts = "${local.lambda_zip_dir}/aggregate-verdicts.zip"
  }
  lambda_local_endpoint = replace(replace(var.localstack_endpoint, "127.0.0.1", "host.docker.internal"), "localhost", "host.docker.internal")
  lambda_env = {
    TENANT_ID         = var.tenant_id
    RAW_BUCKET        = aws_s3_bucket.inbound.bucket
    ARTIFACTS_BUCKET  = aws_s3_bucket.artifacts.bucket
    MESSAGES_TABLE    = local.messages_table_name
    USERS_TABLE       = local.users_table_name
    MAILBOXES_TABLE   = local.mailboxes_table_name
    INBOX_TABLE       = local.inbox_table_name
    ATTACHMENTS_TABLE = local.attachments_table_name
    AUDIT_TABLE       = local.audit_table_name
    EVENT_BUS_NAME    = aws_cloudwatch_event_bus.mail.name
    STAGE             = var.env
    AWS_ENDPOINT_URL  = local.is_local ? local.lambda_local_endpoint : null
  }
}

resource "aws_cloudwatch_log_group" "lambda" {
  for_each          = toset(["init-ledger", "resolve-recipients", "parse-email", "phishing-ml", "attachment-scan", "aggregate-verdicts", "web-server"])
  name              = "/aws/lambda/${local.base_prefix}-${each.value}"
  retention_in_days = 14
}

resource "aws_lambda_function" "init_ledger" {
  function_name = "${local.base_prefix}-init-ledger"
  role          = aws_iam_role.init_ledger.arn
  package_type  = local.use_zip_lambdas ? "Zip" : "Image"
  image_uri     = local.use_zip_lambdas ? null : var.init_ledger_image_uri
  filename      = local.use_zip_lambdas ? local.lambda_zip_files.init_ledger : null
  source_code_hash = local.use_zip_lambdas ? filebase64sha256(
    local.lambda_zip_files.init_ledger
  ) : null
  handler     = local.use_zip_lambdas ? "init_ledger.main.handler" : null
  runtime     = local.use_zip_lambdas ? "python3.10" : null
  timeout     = 300
  memory_size = 1024
  environment {
    variables = local.lambda_env
  }
  depends_on = [aws_cloudwatch_log_group.lambda]
  tags       = local.tags
}

resource "aws_lambda_function" "resolve_recipients" {
  function_name = "${local.base_prefix}-resolve-recipients"
  role          = aws_iam_role.pipeline_lambda.arn
  package_type  = local.use_zip_lambdas ? "Zip" : "Image"
  image_uri     = local.use_zip_lambdas ? null : var.resolve_recipients_image_uri
  filename      = local.use_zip_lambdas ? local.lambda_zip_files.resolve_recipients : null
  source_code_hash = local.use_zip_lambdas ? filebase64sha256(
    local.lambda_zip_files.resolve_recipients
  ) : null
  handler     = local.use_zip_lambdas ? "resolve_recipients.main.handler" : null
  runtime     = local.use_zip_lambdas ? "python3.10" : null
  timeout     = 300
  memory_size = 512
  environment {
    variables = local.lambda_env
  }
  depends_on = [aws_cloudwatch_log_group.lambda]
  tags       = local.tags
}

resource "aws_lambda_function" "parse_email" {
  function_name = "${local.base_prefix}-parse-email"
  role          = aws_iam_role.pipeline_lambda.arn
  package_type  = local.use_zip_lambdas ? "Zip" : "Image"
  image_uri     = local.use_zip_lambdas ? null : var.parse_email_image_uri
  filename      = local.use_zip_lambdas ? local.lambda_zip_files.parse_email : null
  source_code_hash = local.use_zip_lambdas ? filebase64sha256(
    local.lambda_zip_files.parse_email
  ) : null
  handler     = local.use_zip_lambdas ? "parse_email.main.handler" : null
  runtime     = local.use_zip_lambdas ? "python3.10" : null
  timeout     = 300
  memory_size = 1024
  environment {
    variables = merge(local.lambda_env, {
      OUT_PREFIX    = local.parsed_prefix
      ATTACH_PREFIX = local.attach_prefix
    })
  }
  depends_on = [aws_cloudwatch_log_group.lambda]
  tags       = local.tags
}

resource "aws_lambda_function" "phishing_ml" {
  function_name = "${local.base_prefix}-phishing-ml"
  role          = aws_iam_role.pipeline_lambda.arn
  package_type  = local.use_zip_lambdas ? "Zip" : "Image"
  image_uri     = local.use_zip_lambdas ? null : var.phishing_ml_image_uri
  filename      = local.use_zip_lambdas ? local.lambda_zip_files.phishing_ml : null
  source_code_hash = local.use_zip_lambdas ? filebase64sha256(
    local.lambda_zip_files.phishing_ml
  ) : null
  handler     = local.use_zip_lambdas ? "handler.lambda_handler" : null
  runtime     = local.use_zip_lambdas ? "python3.10" : null
  timeout     = 300
  memory_size = 1024
  environment {
    variables = merge(local.lambda_env, {
      PHISHING_ML_ENABLE_DEMO_FALLBACK = local.use_zip_lambdas ? "true" : "false"
    })
  }
  depends_on = [aws_cloudwatch_log_group.lambda]
  tags       = local.tags
}

resource "aws_lambda_function" "attachment_scan" {
  function_name = "${local.base_prefix}-attachment-scan"
  role          = aws_iam_role.pipeline_lambda.arn
  package_type  = local.use_zip_lambdas ? "Zip" : "Image"
  image_uri     = local.use_zip_lambdas ? null : var.attachment_scan_image_uri
  filename      = local.use_zip_lambdas ? local.lambda_zip_files.attachment_scan : null
  source_code_hash = local.use_zip_lambdas ? filebase64sha256(
    local.lambda_zip_files.attachment_scan
  ) : null
  handler     = local.use_zip_lambdas ? "clamav_scan.lambda_handler" : null
  runtime     = local.use_zip_lambdas ? "python3.10" : null
  timeout     = 300
  memory_size = 2048
  environment {
    variables = merge(local.lambda_env, {
      CLAMAV_DB_DIR                = "/var/lib/clamav"
      POWERTOOLS_METRICS_NAMESPACE = "CloudEmailAnalyzer"
      POWERTOOLS_SERVICE_NAME      = "attachment-scan"
      CLAMAV_EICAR_FALLBACK        = "false"
    })
  }
  depends_on = [aws_cloudwatch_log_group.lambda]
  tags       = local.tags
}

resource "aws_lambda_function" "aggregate_verdicts" {
  function_name = "${local.base_prefix}-aggregate-verdicts"
  role          = aws_iam_role.pipeline_lambda.arn
  package_type  = local.use_zip_lambdas ? "Zip" : "Image"
  image_uri     = local.use_zip_lambdas ? null : var.aggregate_verdicts_image_uri
  filename      = local.use_zip_lambdas ? local.lambda_zip_files.aggregate_verdicts : null
  source_code_hash = local.use_zip_lambdas ? filebase64sha256(
    local.lambda_zip_files.aggregate_verdicts
  ) : null
  handler     = local.use_zip_lambdas ? "aggregate_verdicts.main.handler" : null
  runtime     = local.use_zip_lambdas ? "python3.10" : null
  timeout     = 300
  memory_size = 512
  environment {
    variables = local.lambda_env
  }
  depends_on = [aws_cloudwatch_log_group.lambda]
  tags       = local.tags
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

resource "aws_lambda_permission" "allow_sfn_resolve_recipients" {
  statement_id  = "AllowExecutionFromStepFunctions"
  action        = "lambda:InvokeFunction"
  principal     = "states.amazonaws.com"
  function_name = aws_lambda_function.resolve_recipients.function_name
}

resource "aws_lambda_permission" "allow_sfn_phishing_ml" {
  statement_id  = "AllowExecutionFromStepFunctions"
  action        = "lambda:InvokeFunction"
  principal     = "states.amazonaws.com"
  function_name = aws_lambda_function.phishing_ml.function_name
}

resource "aws_lambda_permission" "allow_sfn_attachment_scan" {
  statement_id  = "AllowExecutionFromStepFunctions"
  action        = "lambda:InvokeFunction"
  principal     = "states.amazonaws.com"
  function_name = aws_lambda_function.attachment_scan.function_name
}

resource "aws_lambda_permission" "allow_sfn_aggregate_verdicts" {
  statement_id  = "AllowExecutionFromStepFunctions"
  action        = "lambda:InvokeFunction"
  principal     = "states.amazonaws.com"
  function_name = aws_lambda_function.aggregate_verdicts.function_name
}

# decide at runtime if we create the lambda
locals {
  create_web_server_lambda = (!local.is_local && var.web_server_image_uri != "") ? true : false
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
      TENANT_ID         = var.tenant_id
      MESSAGES_TABLE    = local.messages_table_name
      USERS_TABLE       = local.users_table_name
      MAILBOXES_TABLE   = local.mailboxes_table_name
      INBOX_TABLE       = local.inbox_table_name
      ATTACHMENTS_TABLE = local.attachments_table_name
      AUDIT_TABLE       = local.audit_table_name
      RAW_BUCKET        = aws_s3_bucket.inbound.bucket
      ARTIFACTS_BUCKET  = aws_s3_bucket.artifacts.bucket
      STAGE             = var.env
      AUTH_MODE         = "local-jwt"
      JWT_SECRET        = var.jwt_secret
    }
  }

  lifecycle {
    precondition {
      condition     = var.jwt_secret != ""
      error_message = "jwt_secret must be set when deploying the API Lambda."
    }
  }
  depends_on = [aws_cloudwatch_log_group.lambda]

  tags = local.tags
}
