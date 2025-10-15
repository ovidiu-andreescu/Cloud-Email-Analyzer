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
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.inbound.arn}/${local.inbound_prefix}*"]
  }
  statement {
    actions   = ["s3:PutObject"]
    resources = ["${aws_s3_bucket.inbound.arn}/${local.parsed_prefix}*"]
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

resource "aws_iam_role" "extract_attachments" {
  name               = "${local.base_prefix}-extract-attachments-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume.json
  tags               = local.tags
}

data "aws_iam_policy_document" "extract_attachments" {
  statement {
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.inbound.arn}/${local.inbound_prefix}*"]
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

resource "aws_iam_policy" "extract_attachments" {
  name   = "${local.base_prefix}-extract-attachments-policy"
  policy = data.aws_iam_policy_document.extract_attachments.json
}

resource "aws_iam_role_policy_attachment" "extract_attachments" {
  role       = aws_iam_role.extract_attachments.name
  policy_arn = aws_iam_policy.extract_attachments.arn
}