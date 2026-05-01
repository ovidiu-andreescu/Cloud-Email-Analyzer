resource "random_id" "rand" {
  count       = local.enable_frontend_hosting ? 1 : 0
  byte_length = 3
}

# S3 bucket that will hold the built SPA / frontend
resource "aws_s3_bucket" "frontend" {
  count         = local.enable_frontend_hosting ? 1 : 0
  bucket        = "${local.base_prefix}-frontend-${random_id.rand[0].hex}"
  force_destroy = true
  tags          = local.tags
}

resource "aws_s3_bucket_ownership_controls" "own" {
  count  = local.enable_frontend_hosting ? 1 : 0
  bucket = aws_s3_bucket.frontend[0].id

  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

resource "aws_s3_bucket_public_access_block" "pab" {
  count                   = local.enable_frontend_hosting ? 1 : 0
  bucket                  = aws_s3_bucket.frontend[0].id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Origin Access Control (newer way instead of OAI)
resource "aws_cloudfront_origin_access_control" "oac" {
  count                             = local.enable_frontend_hosting ? 1 : 0
  name                              = "${local.base_prefix}-frontend-oac"
  description                       = "OAC for frontend bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "cdn" {
  count               = local.enable_frontend_hosting ? 1 : 0
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "${local.base_prefix} frontend CDN"
  default_root_object = "index.html"

  origin {
    domain_name = aws_s3_bucket.frontend[0].bucket_regional_domain_name
    origin_id   = "s3-frontend-origin"

    origin_access_control_id = aws_cloudfront_origin_access_control.oac[0].id
  }

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "s3-frontend-origin"
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
  }

  price_class = "PriceClass_100"

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = local.tags
}

data "aws_iam_policy_document" "frontend_bucket_policy" {
  count = local.enable_frontend_hosting ? 1 : 0
  statement {
    sid    = "AllowCloudFrontGet"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }

    actions = [
      "s3:GetObject"
    ]

    resources = ["${aws_s3_bucket.frontend[0].arn}/*"]

    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.cdn[0].arn]
    }
  }
}

resource "aws_s3_bucket_policy" "frontend_policy" {
  count  = local.enable_frontend_hosting ? 1 : 0
  bucket = aws_s3_bucket.frontend[0].id
  policy = data.aws_iam_policy_document.frontend_bucket_policy[0].json

  # make sure distro exists first so we can reference its ARN
  depends_on = [
    aws_cloudfront_distribution.cdn
  ]
}
