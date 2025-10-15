variable "enable_sfn" {
  type    = bool
  default = false
}

data "aws_iam_policy_document" "sfn_assume" {
  statement {
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["states.${var.region}.amazonaws.com", "states.amazonaws.com"]
    }
    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "sfn_role" {
  name               = "${local.base_prefix}-sfn-role"
  assume_role_policy = data.aws_iam_policy_document.sfn_assume.json
  tags               = local.tags
}

data "aws_iam_policy_document" "sfn_policy" {
  statement {
    actions   = ["lambda:InvokeFunction"]
    resources = [
      aws_lambda_function.init_ledger.arn,
      aws_lambda_function.parse_email.arn,
      aws_lambda_function.extract_attachments.arn,
    ]
  }
}

resource "aws_iam_policy" "sfn_policy" {
  name   = "${local.base_prefix}-sfn-policy"
  policy = data.aws_iam_policy_document.sfn_policy.json
}

resource "aws_iam_role_policy_attachment" "sfn_attach" {
  role       = aws_iam_role.sfn_role.name
  policy_arn = aws_iam_policy.sfn_policy.arn
}

locals {
  sfn_def = jsonencode({
    Comment = "Email pipeline: ledger -> parse -> extract"
    StartAt = "InitLedger"
    States = {
      InitLedger = {
        Type = "Task"
        Resource = aws_lambda_function.init_ledger.arn
        Retry = [{ ErrorEquals = ["States.ALL"], IntervalSeconds = 2, BackoffRate = 2.0, MaxAttempts = 3 }]
        Next = "ParseEmail"
      }
      ParseEmail = {
        Type = "Task"
        Resource = aws_lambda_function.parse_email.arn
        Retry = [{ ErrorEquals = ["States.ALL"], IntervalSeconds = 2, BackoffRate = 2.0, MaxAttempts = 3 }]
        Next = "ExtractAttachments"
      }
      ExtractAttachments = {
        Type = "Task"
        Resource = aws_lambda_function.extract_attachments.arn
        Retry = [{ ErrorEquals = ["States.ALL"], IntervalSeconds = 2, BackoffRate = 2.0, MaxAttempts = 3 }]
        End = true
      }
    }
  })
}

resource "aws_sfn_state_machine" "email_pipeline" {
  name        = "${local.base_prefix}-email-pipeline"
  role_arn    = aws_iam_role.sfn_role.arn
  definition  = local.sfn_def
  tags        = local.tags
}
