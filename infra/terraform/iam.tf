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

data "aws_iam_policy_document" "email_processor" {
  statement {
    actions   = ["s3:GetObject", "s3:DeleteObject"]
    resources = ["${aws_s3_bucket.inbound.arn}/inbound/*"]
  }
  statement {
    actions   = ["s3:PutObject"]
    resources = ["${aws_s3_bucket.inbound.arn}/processed/*"]
  }
}

resource "aws_iam_policy" "email_processor" {
  count  = contains(keys(var.lambda_defs), "email_processor") ? 1 : 0
  name   = "${local.base_prefix}-email-processor"
  policy = data.aws_iam_policy_document.email_processor.json
}

resource "aws_iam_role_policy_attachment" "email_processor" {
  count      = contains(keys(var.lambda_defs), "email_processor") ? 1 : 0
  role       = aws_iam_role.lambda["email_processor"].name
  policy_arn = aws_iam_policy.email_processor[0].arn
}
