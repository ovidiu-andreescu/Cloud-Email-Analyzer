resource "aws_cloudwatch_log_group" "lambda" {
  for_each          = var.lambda_defs
  name              = "/aws/lambda/${local.lambda_names[each.key]}"
  retention_in_days = 14
}

# Lambda functions (zip or image)

resource "aws_lambda_function" "fn" {
  for_each = var.lambda_defs

  function_name = local.lambda_names[each.key]
  role          = aws_iam_role.lambda[each.key].arn
  timeout       = each.value.timeout
  memory_size   = each.value.memory_mb
  publish       = true
  package_type  = local.package_type

  image_uri = local.package_type == "Image" ? (
    try(each.value.image_uri, "") != "" ?
      each.value.image_uri :
      "${aws_ecr_repository.lambda[each.key].repository_url}:${ try(each.value.image_tag, "") != "" ? each.value.image_tag : "latest" }"
  ) : null

  filename = local.package_type == "Zip" ? each.value.filename : null
  runtime  = local.package_type == "Zip" ? each.value.runtime  : null
  handler  = local.package_type == "Zip" ? each.value.handler  : null

  environment {
    variables = merge(
      { STAGE = var.env },
      try(each.value.env_vars, {})
    )
  }

  depends_on = [aws_cloudwatch_log_group.lambda]
}

