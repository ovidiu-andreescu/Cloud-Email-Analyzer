#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TF_DIR="$ROOT/infra/terraform"
TFVARS_FILE="${TFVARS_FILE:-$ROOT/infra/env/local_dev/terraform.tfvars}"
if [[ ! -f "$TFVARS_FILE" ]]; then
  TFVARS_FILE="$ROOT/infra/env/local_dev/terraform.tfvars.example"
fi
ENDPOINT="${LOCALSTACK_ENDPOINT:-http://localhost:4566}"
REGION="${AWS_REGION:-eu-central-1}"

if [[ ! -f "$ROOT/.localstack-build/lambdas/init-ledger.zip" ]]; then
  echo "Missing LocalStack Lambda ZIP packages. Run make local-build first."
  exit 1
fi

declare INIT_LEDGER="" RESOLVE_RECIPIENTS="" PARSE_EMAIL="" PHISHING_ML="" ATTACHMENT_SCAN="" AGGREGATE_VERDICTS="" WEB_SERVER=""
if [[ -f "$ROOT/.localstack-images.env" ]]; then
  while IFS='=' read -r key value; do
    case "$key" in
      init-ledger) INIT_LEDGER="$value" ;;
      resolve-recipients) RESOLVE_RECIPIENTS="$value" ;;
      parse-email) PARSE_EMAIL="$value" ;;
      phishing-ml) PHISHING_ML="$value" ;;
      attachment-scan) ATTACHMENT_SCAN="$value" ;;
      aggregate-verdicts) AGGREGATE_VERDICTS="$value" ;;
      web-server) WEB_SERVER="$value" ;;
    esac
  done < "$ROOT/.localstack-images.env"
fi

cd "$TF_DIR"
AWS_ACCESS_KEY_ID=test AWS_SECRET_ACCESS_KEY=test AWS_DEFAULT_REGION="$REGION" terraform init -reconfigure -backend=false
AWS_ACCESS_KEY_ID=test AWS_SECRET_ACCESS_KEY=test AWS_DEFAULT_REGION="$REGION" terraform workspace select local-dev >/dev/null 2>&1 || \
  AWS_ACCESS_KEY_ID=test AWS_SECRET_ACCESS_KEY=test AWS_DEFAULT_REGION="$REGION" terraform workspace new local-dev

AWS_ACCESS_KEY_ID=test AWS_SECRET_ACCESS_KEY=test AWS_DEFAULT_REGION="$REGION" terraform apply -auto-approve \
  -var-file="$TFVARS_FILE" \
  -var="localstack_endpoint=${ENDPOINT}" \
  -var="init_ledger_image_uri=${INIT_LEDGER}" \
  -var="resolve_recipients_image_uri=${RESOLVE_RECIPIENTS}" \
  -var="parse_email_image_uri=${PARSE_EMAIL}" \
  -var="phishing_ml_image_uri=${PHISHING_ML}" \
  -var="attachment_scan_image_uri=${ATTACHMENT_SCAN}" \
  -var="aggregate_verdicts_image_uri=${AGGREGATE_VERDICTS}" \
  -var="web_server_image_uri=${WEB_SERVER}"

AWS_ENDPOINT_URL="$ENDPOINT" AWS_DEFAULT_REGION="$REGION" LOCAL_PREFIX="cloud-email-analyzer-local-dev" \
  "$ROOT/scripts/ensure_local_pipeline.py"

AWS_ENDPOINT_URL="$ENDPOINT" AWS_DEFAULT_REGION="$REGION" LOCAL_PREFIX="cloud-email-analyzer-local-dev" \
  "$ROOT/scripts/ensure_local_tables.py"

echo "[local-deploy] API local server target: make local-api"
