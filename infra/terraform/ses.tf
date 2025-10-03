locals {
  enable_ses = var.env != "local-dev" && var.domain_name != ""
}

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
  records = ["${aws_ses_domain_dkim.dkim[0].dkim_tokens[count.index]}.dkim.amazonses.com"]
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

  s3_action {
    bucket_name = aws_s3_bucket.inbound.bucket
    object_key_prefix = "inbound/"
    position = 1
  }

  lambda_action {
    function_arn = aws_lambda_function.fn["email_processor"].arn
    invocation_type = "Event"
    position = 2
  }

  depends_on = [aws_lambda_permission.allow_ses]
}

resource "aws_lambda_permission" "allow_ses" {
  count         = local.enable_ses && contains(keys(var.lambda_defs), "email_processor") ? 1 : 0
  statement_id  = "AllowExecutionFromSES"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.fn["email_processor"].function_name
  principal     = "ses.amazonaws.com"
  source_account = data.aws_caller_identity.current.account_id
}
