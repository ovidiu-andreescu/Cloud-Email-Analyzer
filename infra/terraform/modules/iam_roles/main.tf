locals {
  assume_role = {
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = { Service = var.assume_services }
      Action = "sts:AssumeRole"
    }]
  }
}

resource "aws_iam_role" "this" {
  name               = var.name
  assume_role_policy = jsonencode(local.assume_role)
  tags               = var.tags
}

resource "aws_iam_role_policy" "inline" {
  for_each = var.inline_policies
  name     = each.key
  role     = aws_iam_role.this.id
  policy   = each.value
}
