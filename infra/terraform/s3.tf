resource "aws_s3_bucket" "inbound" {
  bucket        = local.bucket_name
  tags   = local.tags
}

data "aws_iam_policy_document" "all_bucket_policy" {
  version = "2012-10-17"

  statement {
      sid       = "AllowSESPuts"
      effect    = "Allow"
      principals {
        type        = "Service"
        identifiers = ["ses.amazonaws.com"]
      }
      actions   = ["s3:PutObject"]
      resources = ["${aws_s3_bucket.inbound.arn}/${local.inbound_prefix}*"]

      condition {
        test     = "StringEquals"
        variable = "aws:SourceAccount"
        values   = [data.aws_caller_identity.current.account_id]
      }
  }

  statement {
    sid    = "StatementFromInboundPolicy"
    effect = "Allow"
    principals {
      type        = "AWS"
      identifiers = ["arn:aws:iam::${var.aws_account_id}:root"]
    }
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.inbound.arn}/*"]
  }

  statement {
    sid    = "StatementFromSfnStart"
    effect = "Allow"
    principals {
      type        = "AWS"
      identifiers = [aws_iam_role.sfn_role.arn]
    }
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.inbound.arn}/*"]
  }
}

resource "aws_s3_bucket_policy" "bucket_policy" {
  bucket = aws_s3_bucket.inbound.id
  policy = data.aws_iam_policy_document.all_bucket_policy.json
}

resource "aws_s3_bucket_versioning" "inbound" {
  bucket = aws_s3_bucket.inbound.id
  versioning_configuration { status = "Enabled" }
}

resource "aws_s3_bucket_public_access_block" "inbound" {
  bucket                  = aws_s3_bucket.inbound.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "inbound" {
  bucket = aws_s3_bucket.inbound.id
  rule {
    id     = "expire-raw-eml"
    status = "Enabled"
    filter { prefix = "inbound/" }
    expiration { days = 1 }
  }
}

resource "aws_cloudwatch_event_rule" "s3_new_email" {
  name        = "${local.base_prefix}-s3-new-email-rule"
  description = "Trigger SFN when a new email arrives in the inbound bucket"

  event_pattern = jsonencode({
    "source" : ["aws.s3"],
    "detail-type" : ["Object Created"],
    "detail" : {
      "bucket" : {
        "name" : [aws_s3_bucket.inbound.id]
      },
      "object" : {
        "key" : [{ "prefix" : local.inbound_prefix }]
      }
    }
  })
}