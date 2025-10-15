resource "aws_s3_bucket" "inbound" {
  bucket        = local.bucket_name
  tags   = local.tags
}

resource "aws_s3_bucket_policy" "ses_put" {
  bucket = aws_s3_bucket.inbound.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid       = "AllowSESPuts"
      Effect    = "Allow"
      Principal = { Service = "ses.amazonaws.com" }
      Action    = ["s3:PutObject"]
      Resource  = "${aws_s3_bucket.inbound.arn}/${local.inbound_prefix}*"
      Condition = {
        StringEquals = {
          "aws:Referer" = data.aws_caller_identity.current.id
        }
      }
    }]
  })
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

resource "aws_s3_bucket_notification" "inbound" {
  bucket = aws_s3_bucket.inbound.id

  lambda_function {
    lambda_function_arn = aws_lambda_function.parse_email.arn
    events              = ["s3:ObjectCreated:*"]
    filter_prefix       = local.inbound_prefix
    filter_suffix       = ".eml"
  }

  depends_on = [
    aws_lambda_permission.s3_invoke_parse
  ]
}

resource "aws_lambda_permission" "s3_invoke_parse" {
  statement_id  = "AllowS3InvokeParse"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.parse_email.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = aws_s3_bucket.inbound.arn
}
