resource "aws_apigatewayv2_api" "http_api" {
  name          = "${local.base_prefix}-http-api"
  protocol_type = "HTTP"
  tags = local.tags
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.http_api.id
  name        = "$default"
  auto_deploy = true
}

resource "aws_apigatewayv2_integration" "api_lambda_integration" {
  count                     = length(aws_lambda_function.api_server) > 0 ? 1 : 0
  api_id                    = aws_apigatewayv2_api.http_api.id
  integration_type          = "AWS_PROXY"
  integration_uri           = aws_lambda_function.api_server[0].invoke_arn
  payload_format_version    = "2.0"
}

resource "aws_apigatewayv2_route" "api_proxy_route" {
  count    = length(aws_apigatewayv2_integration.api_lambda_integration) > 0 ? 1 : 0
  api_id   = aws_apigatewayv2_api.http_api.id
  route_key = "ANY /{proxy+}"
  target   = "integrations/${aws_apigatewayv2_integration.api_lambda_integration[0].id}"
}

resource "aws_lambda_permission" "api_gateway_permission" {
  count         = length(aws_lambda_function.api_server) > 0 ? 1 : 0
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api_server[0].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}

resource "aws_apigatewayv2_route" "root_route" {
  count     = length(aws_apigatewayv2_integration.api_lambda_integration) > 0 ? 1 : 0
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "ANY /"
  target    = "integrations/${aws_apigatewayv2_integration.api_lambda_integration[0].id}"
}