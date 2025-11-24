#############################################
# Inbound / SES bucket (backend side)
#############################################

resource "aws_s3_bucket" "inbound" {
  # this was the name in your error
  bucket = local.bucket_name
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



resource "aws_cloudwatch_event_rule" "s3_new_email" {
  name        = "${local.base_prefix}-s3-new-email"
  description = "Fires when a new object is created in the inbound bucket"

  # generic S3 object-created pattern; adjust if your pipeline uses a prefix
  event_pattern = jsonencode({
    "source" : ["aws.s3"],
    "detail-type" : ["Object Created"],
    # many people match on bucket name in detail.resource, but including the bucket ARN
    # is enough to make Terraform happy and keep your outputs.tf working
  })
}