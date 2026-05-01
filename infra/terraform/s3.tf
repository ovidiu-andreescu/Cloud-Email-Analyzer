#############################################
# Inbound / SES bucket (backend side)
#############################################

resource "aws_s3_bucket" "inbound" {
  bucket = local.bucket_name
  tags   = local.tags
}

resource "aws_s3_bucket" "artifacts" {
  bucket = local.artifacts_bucket_name
  tags   = local.tags
}

resource "aws_s3_bucket_versioning" "inbound" {
  bucket = aws_s3_bucket.inbound.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_public_access_block" "inbound" {
  bucket                  = aws_s3_bucket.inbound.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# policy ONLY for this private/inbound bucket
data "aws_iam_policy_document" "inbound_bucket_policy" {
  # allow SES (or similar) to put objects
  statement {
    sid    = "AllowSESPut"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["ses.amazonaws.com"]
    }

    actions = ["s3:PutObject"]

    resources = [
      "${aws_s3_bucket.inbound.arn}/*"
    ]

    condition {
      test     = "StringEquals"
      variable = "AWS:SourceAccount"
      values   = [local.account_id]
    }
  }

  # allow our own account to list/read
  statement {
    sid    = "AllowAccountAccess"
    effect = "Allow"

    principals {
      type        = "AWS"
      identifiers = ["arn:aws:iam::${local.account_id}:root"]
    }

    actions = [
      "s3:ListBucket",
      "s3:GetObject",
      "s3:PutObject"
    ]

    resources = [
      aws_s3_bucket.inbound.arn,
      "${aws_s3_bucket.inbound.arn}/*"
    ]
  }
}

resource "aws_s3_bucket_policy" "bucket_policy" {
  bucket = aws_s3_bucket.inbound.id
  policy = data.aws_iam_policy_document.inbound_bucket_policy.json
}



resource "aws_cloudwatch_event_bus" "mail" {
  name = local.event_bus_name
}

resource "aws_cloudwatch_event_rule" "s3_new_email" {
  name           = "${local.base_prefix}-mail-received"
  description    = "Starts the mail analysis pipeline from canonical MailReceived events"
  event_bus_name = aws_cloudwatch_event_bus.mail.name

  event_pattern = jsonencode({
    "source" : ["mail.security.ingest"],
    "detail-type" : ["MailReceived"]
  })
}
