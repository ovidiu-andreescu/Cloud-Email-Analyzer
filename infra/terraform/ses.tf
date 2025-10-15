data "aws_route53_zone" "this" {
  count = local.enable_ses ? 1 : 0
  name         = var.domain_name
  private_zone = false
}

resource "aws_ses_domain_identity" "this" {
  count  = local.enable_ses ? 1 : 0
  domain = var.domain_name
}

resource "aws_ses_domain_dkim" "dkim" {
  count  = local.enable_ses ? 1 : 0
  domain = aws_ses_domain_identity.this[0].domain
}

resource "aws_route53_record" "dkim" {
  count   = local.enable_ses ? 3 : 0
  zone_id = data.aws_route53_zone.this[0].zone_id
  name    = "${aws_ses_domain_dkim.dkim[0].dkim_tokens[count.index]}._domainkey.${var.domain_name}"
  type    = "CNAME"
  ttl     = 300
  records = ["${aws_ses_domain_dkim.dkim[0].dkim_tokens[count.index]}.dkim.amazonses.com."]
}

resource "aws_route53_record" "ses_verif" {
  count   = local.enable_ses ? 1 : 0
  zone_id = data.aws_route53_zone.this[0].zone_id
  name    = "_amazonses.${var.domain_name}"
  type    = "TXT"
  ttl     = 300
  records = [aws_ses_domain_identity.this[0].verification_token]
}

resource "aws_route53_record" "mx_inbound" {
  count   = local.enable_ses ? 1 : 0
  zone_id = data.aws_route53_zone.this[0].zone_id
  name    = var.domain_name
  type    = "MX"
  ttl     = 300
  records = ["10 inbound-smtp.${var.region}.amazonaws.com"]
}

resource "aws_ses_receipt_rule_set" "main" {
  count = local.enable_ses ? 1 : 0
  rule_set_name = "${local.base_prefix}-rules"
}

resource "aws_ses_active_receipt_rule_set" "active" {
  count = local.enable_ses ? 1 : 0
  rule_set_name = aws_ses_receipt_rule_set.main[0].rule_set_name
}

resource "aws_ses_receipt_rule" "inbound" {
  count         = local.enable_ses ? 1 : 0
  name          = "${local.base_prefix}-inbound"
  rule_set_name = aws_ses_receipt_rule_set.main[0].rule_set_name
  recipients    = [var.domain_name]
  enabled       = true
  scan_enabled  = true
  tls_policy    = "Optional"

  s3_action {
    bucket_name = aws_s3_bucket.inbound.bucket
    object_key_prefix = local.inbound_prefix
    kms_key_arn = var.kms_key_arn
    position = 1
  }
}
