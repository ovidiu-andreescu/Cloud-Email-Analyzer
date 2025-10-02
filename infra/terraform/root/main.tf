data "aws_caller_identity" "me" {}

locals {
  base_prefix = length(var.prefix) > 0 ? var.prefix : "${var.project}-${var.env}"
  tags        = merge({ Project = var.project, Env = var.env }, var.tags)

  package_type = var.env == "local_dev" ? "Zip" : "Image"

  default_lambda_defs = {
    # jobs = {
    #   filename = "artifacts/jobs_ingestor.zip"
    #   runtime  = "python3.11"
    #   handler  = "app.handler"
    #   env_vars = { STAGE = var.env }
    # }
    # notifications = {
    #   filename = "artifacts/notifications.zip"
    #   runtime  = "python3.11"
    #   handler  = "app.handler"
    #   env_vars = { STAGE = var.env }
    # }
  }

  lambdas = length(keys(var.lambda_defs)) > 0 ? var.lambda_defs : local.default_lambda_defs

  has_image_map = {
    for name, cfg in local.lambdas :
    name => (
      (lookup(cfg, "image_uri", "") != "") ||
      (lookup(cfg, "image_tag", "") != "")
    )
  }

  lambdas_to_apply = {
    for name, cfg in local.lambdas :
    name => cfg
    if (
      local.package_type == "Zip" ||
      (local.package_type == "Image" && local.has_image_map[name])
    )
  }

  lambda_names = {
    for name, _ in local.lambdas : name => "${local.base_prefix}-${name}"
  }
}

module "lambda_role" {
  source = "../modules/iam_roles"

  name = "${local.base_prefix}-lambda"

  inline_policies = {
    logs = jsonencode({
      Version = "2012-10-17",
      Statement = [{
        Effect   = "Allow",
        Action   = ["logs:CreateLogGroup","logs:CreateLogStream","logs:PutLogEvents"],
        Resource = "*"
      }]
    })
  }

  tags = local.tags
}

module "ecr" {
  for_each = var.env == "local_dev" ? {} : local.lambdas
  source   = "../modules/ecr_repo"

  name = "${local.base_prefix}-${each.key}"
  tags = local.tags
}

module "lambda_fn" {
  for_each = local.lambdas_to_apply
  source   = "../modules/lambda"

  function_name = local.lambda_names[each.key]
  role_arn      = module.lambda_role.arn
  package_type  = local.package_type

  image_uri = (
  local.package_type == "Image"
    ? (
        length(lookup(each.value, "image_uri", "")) > 0
          ? lookup(each.value, "image_uri", "")
          : (
              length(lookup(each.value, "image_tag", "")) > 0
                ? "${module.ecr[each.key].repo_url}:${lookup(each.value, "image_tag", "")}"
                : "${module.ecr[each.key].repo_url}:latest"
            )
      )
    : null
)

  runtime           = lookup(each.value, "runtime", "python3.11")
  handler           = lookup(each.value, "handler", "app.handler")
  filename          = lookup(each.value, "filename", "")
  s3_bucket         = lookup(each.value, "s3_bucket", "")
  s3_key            = lookup(each.value, "s3_key", "")
  s3_object_version = lookup(each.value, "s3_object_version", "")

  memory_size   = lookup(each.value, "memory_size", 512)
  timeout       = lookup(each.value, "timeout", 30)
  architectures = lookup(each.value, "architectures", ["x86_64"])
  env_vars      = lookup(each.value, "env_vars", {})
  layers        = lookup(each.value, "layers", [])
  publish       = lookup(each.value, "publish", false)
  tags          = local.tags
}

