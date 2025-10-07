resource "aws_s3_bucket" "inbound" {
  bucket        = "${local.base_prefix}-inbound"
  force_destroy = true
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

resource "aws_s3_bucket_server_side_encryption_configuration" "inbound" {
  bucket = aws_s3_bucket.inbound.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = var.kms_key_arn
    }
  }
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

resource "aws_s3_bucket_notification" "inbound" {
  bucket = aws_s3_bucket.inbound.id
  eventbridge = true
}

resource "aws_s3_bucket_policy" "inbound" {
  bucket = aws_s3_bucket.inbound.id
  policy = data.aws_iam_policy_document.email_processor.json
}
