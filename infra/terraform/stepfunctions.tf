# enable_sfn var unchanged
# Use the global Step Functions principal
data "aws_iam_policy_document" "sfn_assume" {
  statement {
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["states.amazonaws.com"]
    }
    actions = ["sts:AssumeRole"]
  }
}

data "aws_lambda_function" "virus_scan" {
  function_name = "virus-scan-clam-av"
}

resource "aws_iam_role" "sfn_role" {
  name               = "${local.base_prefix}-sfn-role"
  assume_role_policy = data.aws_iam_policy_document.sfn_assume.json
  tags               = local.tags
}

data "aws_iam_policy_document" "sfn_policy" {
  statement {
    effect    = "Allow"
    actions   = ["lambda:InvokeFunction"]
    resources = [
      aws_lambda_function.init_ledger.arn,
      aws_lambda_function.parse_email.arn,
      data.aws_lambda_function.virus_scan.arn
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

resource "aws_sfn_state_machine" "email_pipeline" {
  name     = "${local.base_prefix}-email-pipeline"
  role_arn = aws_iam_role.sfn_role.arn
  tags     = local.tags

  definition = templatefile("email_pipeline.asl.json", {
    init_ledger_lambda_arn         = aws_lambda_function.init_ledger.arn
    parse_email_lambda_arn         = aws_lambda_function.parse_email.arn
    virus_scan_lambda_arn          = data.aws_lambda_function.virus_scan.arn
  })

  depends_on = [
    aws_iam_role_policy_attachment.sfn_attach
  ]
}

resource "aws_s3_bucket_notification" "send_to_eventbridge" {
  bucket = aws_s3_bucket.inbound.id
  eventbridge = true
}

data "aws_iam_policy_document" "eventbridge_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["events.amazonaws.com"]
    }
  }
}

resource "aws_cloudwatch_event_target" "start_sfn_pipeline_target" {
  rule      = aws_cloudwatch_event_rule.s3_new_email.name
  target_id = "StartEmailPipelineSFN"
  arn       = aws_sfn_state_machine.email_pipeline.arn
  role_arn  = aws_iam_role.eventbridge_sfn_role.arn
}