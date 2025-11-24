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
    resources = [aws_dynamodb_table.ledger.arn]
  }

  statement {
    actions   = ["dynamodb:PutItem", "dynamodb:DescribeTable"]
    resources = [aws_dynamodb_table.ledger.arn]
  }
  statement {
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.inbound.arn}/${local.inbound_prefix}*"]
  }
  statement {
    actions   = ["logs:CreateLogGroup","logs:CreateLogStream","logs:PutLogEvents"]
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
    resources = [aws_dynamodb_table.ledger.arn]
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
    actions   = ["logs:CreateLogGroup","logs:CreateLogStream","logs:PutLogEvents"]
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
    resources = [aws_sfn_state_machine.email_pipeline.arn]
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
      aws_dynamodb_table.ledger.arn,
      aws_dynamodb_table.user.arn
    ]
  }

  statement {
    actions = ["dynamodb:Scan"]
    resources = [
      aws_dynamodb_table.ledger.arn,
      aws_dynamodb_table.user.arn
    ]
  }

  statement {
    actions = ["dynamodb:Query"]
    resources = [
      aws_dynamodb_table.user.arn, # Not strictly needed, but good practice
      "${aws_dynamodb_table.user.arn}/index/by-activity-gsi"
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