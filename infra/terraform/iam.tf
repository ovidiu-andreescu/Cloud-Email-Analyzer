data "aws_iam_policy_document" "lambda_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "lambda" {
  for_each           = var.lambda_defs
  name               = "${local.base_prefix}-${each.key}-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume.json
}

data "aws_iam_policy_document" "logs" {
  statement {
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]
    resources = ["*"]
  }
}

resource "aws_iam_policy" "logs" {
  name   = "${local.base_prefix}-lambda-logs"
  policy = data.aws_iam_policy_document.logs.json
}

resource "aws_iam_role_policy_attachment" "logs" {
  for_each   = var.lambda_defs
  role       = aws_iam_role.lambda[each.key].name
  policy_arn = aws_iam_policy.logs.arn
}

resource "aws_iam_role" "init_ledger" {
  name               = "${local.base_prefix}-init-ledger-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume.json
  tags               = local.tags
}


data "aws_iam_policy_document" "init_ledger" {
  statement {
    actions   = ["dynamodb:UpdateItem"]
    resources = [local.messages_table_arn]
  }

  statement {
    actions   = ["dynamodb:PutItem", "dynamodb:DescribeTable"]
    resources = [local.messages_table_arn]
  }
  statement {
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.inbound.arn}/${local.inbound_prefix}*"]
  }
  statement {
    actions   = ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"]
    resources = ["*"]
  }
}

resource "aws_iam_policy" "init_ledger" {
  name   = "${local.base_prefix}-init-ledger-policy"
  policy = data.aws_iam_policy_document.init_ledger.json
}

resource "aws_iam_role_policy_attachment" "init_ledger" {
  role       = aws_iam_role.init_ledger.name
  policy_arn = aws_iam_policy.init_ledger.arn
}

resource "aws_iam_role" "parse_email" {
  name               = "${local.base_prefix}-parse-email-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume.json
  tags               = local.tags
}

data "aws_iam_policy_document" "parse_email" {
  statement {
    actions   = ["dynamodb:UpdateItem"]
    resources = [local.messages_table_arn]
  }

  statement {
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.inbound.arn}/${local.inbound_prefix}*"]
  }
  statement {
    actions   = ["s3:PutObject"]
    resources = ["${aws_s3_bucket.inbound.arn}/${local.parsed_prefix}*"]
  }

  statement {
    actions   = ["s3:PutObject"]
    resources = ["${aws_s3_bucket.inbound.arn}/${local.attach_prefix}*"]
  }

  statement {
    actions   = ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"]
    resources = ["*"]
  }
}

resource "aws_iam_policy" "parse_email" {
  name   = "${local.base_prefix}-parse-email-policy"
  policy = data.aws_iam_policy_document.parse_email.json
}

resource "aws_iam_role_policy_attachment" "parse_email" {
  role       = aws_iam_role.parse_email.name
  policy_arn = aws_iam_policy.parse_email.arn
}

resource "aws_iam_role" "pipeline_lambda" {
  name               = "${local.base_prefix}-pipeline-lambda-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume.json
  tags               = local.tags
}

data "aws_iam_policy_document" "pipeline_lambda" {
  statement {
    actions = [
      "dynamodb:PutItem",
      "dynamodb:GetItem",
      "dynamodb:UpdateItem",
      "dynamodb:Query",
      "dynamodb:Scan",
      "dynamodb:DescribeTable"
    ]
    resources = [
      local.messages_table_arn,
      local.users_table_arn,
      local.mailboxes_table_arn,
      local.inbox_table_arn,
      local.attachments_table_arn
    ]
  }

  statement {
    actions = ["s3:GetObject", "s3:PutObject", "s3:ListBucket"]
    resources = [
      aws_s3_bucket.inbound.arn,
      "${aws_s3_bucket.inbound.arn}/*",
      aws_s3_bucket.artifacts.arn,
      "${aws_s3_bucket.artifacts.arn}/*"
    ]
  }

  statement {
    actions   = ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"]
    resources = ["*"]
  }
}

resource "aws_iam_policy" "pipeline_lambda" {
  name   = "${local.base_prefix}-pipeline-lambda-policy"
  policy = data.aws_iam_policy_document.pipeline_lambda.json
}

resource "aws_iam_role_policy_attachment" "pipeline_lambda" {
  role       = aws_iam_role.pipeline_lambda.name
  policy_arn = aws_iam_policy.pipeline_lambda.arn
}

resource "aws_iam_role" "eventbridge_sfn_role" {
  name = "${var.project}-eventbridge-sfn-role"
  tags = local.tags

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "events.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

data "aws_iam_policy_document" "allow_start_execution" {
  statement {
    sid       = "AllowStartExecution"
    effect    = "Allow"
    actions   = ["states:StartExecution"]
    resources = [local.state_machine_arn]
  }
}

resource "aws_iam_policy" "eventbridge_start_sfn_policy" {
  name   = "${var.project}-start-sfn-policy"
  policy = data.aws_iam_policy_document.allow_start_execution.json
}

resource "aws_iam_role_policy_attachment" "attach_eventbridge_start_sfn" {
  role       = aws_iam_role.eventbridge_sfn_role.name
  policy_arn = aws_iam_policy.eventbridge_start_sfn_policy.arn
}

data "aws_iam_policy_document" "api_lambda_policy" {
  statement {
    actions   = ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"]
    resources = ["arn:aws:logs:*:*:*"]
  }

  statement {
    actions = ["dynamodb:DescribeTable"]
    resources = [
      local.messages_table_arn,
      local.users_table_arn,
      local.mailboxes_table_arn,
      local.inbox_table_arn,
      local.attachments_table_arn
    ]
  }

  statement {
    actions = ["dynamodb:GetItem", "dynamodb:Scan", "dynamodb:Query"]
    resources = [
      local.messages_table_arn,
      local.users_table_arn,
      local.mailboxes_table_arn,
      local.inbox_table_arn,
      local.attachments_table_arn
    ]
  }

  statement {
    actions = ["dynamodb:Query"]
    resources = [
      local.users_table_arn, # Not strictly needed, but good practice
      "${local.users_table_arn}/index/by-activity-gsi",
      local.inbox_table_arn,
      local.attachments_table_arn
    ]
  }
}


resource "aws_iam_role" "api_lambda_role" {
  name               = "api-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume.json
}


resource "aws_iam_role_policy" "api_lambda_policy" {
  name   = "api-lambda-policy"
  role   = aws_iam_role.api_lambda_role.id
  policy = data.aws_iam_policy_document.api_lambda_policy.json
}
