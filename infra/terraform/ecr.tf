resource "aws_ecr_repository" "lambda" {
  for_each = var.lambda_defs
  name                 = "${local.base_prefix}-${each.key}"
  image_tag_mutability = "MUTABLE"
  image_scanning_configuration { scan_on_push = true }
  force_delete = true
}

resource "aws_ecr_lifecycle_policy" "lambda" {
  for_each  = aws_ecr_repository.lambda
  repository = each.value.name
  policy = jsonencode({
    rules = [{
      rulePriority = 1,
      description  = "Keep last 10 images"
      selection = {
        tagStatus   = "any"
        countType   = "imageCountMoreThan"
        countNumber = 10
      }
      action = { type = "expire" }
    }]
  })
}

# resource "aws_ecr_repository" "init_ledger" {
#   name                 = "${local.base_prefix}-init-ledger"
#   image_tag_mutability = "MUTABLE"
#   image_scanning_configuration {
#     scan_on_push = true
#   }
# }
#
# resource "aws_ecr_repository" "parse_email" {
#   name                 = "${local.base_prefix}-parse-email"
#   image_tag_mutability = "MUTABLE"
#   image_scanning_configuration {
#     scan_on_push = true
#   }
# }
#
# resource "aws_ecr_repository" "extract_attachments" {
#   name                 = "${local.base_prefix}-extract-attachments"
#   image_tag_mutability = "MUTABLE"
#   image_scanning_configuration {
#     scan_on_push = true
#   }
# }
