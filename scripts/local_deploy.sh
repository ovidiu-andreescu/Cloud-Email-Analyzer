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
MODE="${LOCAL_LAMBDA_MODE:-image}"
PREFIX="${LOCAL_PREFIX:-cloud-email-analyzer-local-dev}"

if [[ "$MODE" == "zip" && ! -f "$ROOT/.localstack-build/lambdas/init-ledger.zip" ]]; then
  echo "Missing LocalStack Lambda ZIP packages. Run make local-build first."
  exit 1
fi

if [[ "$MODE" == "zip" && "${ALLOW_EXPERIMENTAL_ZIP_LAMBDAS:-0}" != "1" ]]; then
  echo "LOCAL_LAMBDA_MODE=zip is an experimental local-free fallback path."
  echo "It does not yet include real ClamAV or packaged ML artifacts."
  echo "Set ALLOW_EXPERIMENTAL_ZIP_LAMBDAS=1 if you intentionally want to test it."
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

if [[ "$MODE" == "image" ]]; then
  missing=()
  [[ -n "$INIT_LEDGER" ]] || missing+=("init-ledger")
  [[ -n "$RESOLVE_RECIPIENTS" ]] || missing+=("resolve-recipients")
  [[ -n "$PARSE_EMAIL" ]] || missing+=("parse-email")
  [[ -n "$PHISHING_ML" ]] || missing+=("phishing-ml")
  [[ -n "$ATTACHMENT_SCAN" ]] || missing+=("attachment-scan")
  [[ -n "$AGGREGATE_VERDICTS" ]] || missing+=("aggregate-verdicts")
  if (( ${#missing[@]} > 0 )); then
    echo "Missing LocalStack Lambda image URIs for: ${missing[*]}"
    echo "Run make local-build with LocalStack Pro active, or use LOCAL_LAMBDA_MODE=zip."
    exit 1
  fi
elif [[ "$MODE" != "zip" ]]; then
  echo "LOCAL_LAMBDA_MODE must be image or zip, got: $MODE"
  exit 2
fi

cd "$TF_DIR"
AWS_ACCESS_KEY_ID=test AWS_SECRET_ACCESS_KEY=test AWS_DEFAULT_REGION="$REGION" terraform init -reconfigure -backend=false
AWS_ACCESS_KEY_ID=test AWS_SECRET_ACCESS_KEY=test AWS_DEFAULT_REGION="$REGION" terraform workspace select local-dev >/dev/null 2>&1 || \
  AWS_ACCESS_KEY_ID=test AWS_SECRET_ACCESS_KEY=test AWS_DEFAULT_REGION="$REGION" terraform workspace new local-dev

AWS_ACCESS_KEY_ID=test AWS_SECRET_ACCESS_KEY=test AWS_DEFAULT_REGION="$REGION" terraform apply -auto-approve \
  -var-file="$TFVARS_FILE" \
  -var="localstack_endpoint=${ENDPOINT}" \
  -var="local_lambda_mode=${MODE}" \
  -var="init_ledger_image_uri=${INIT_LEDGER}" \
  -var="resolve_recipients_image_uri=${RESOLVE_RECIPIENTS}" \
  -var="parse_email_image_uri=${PARSE_EMAIL}" \
  -var="phishing_ml_image_uri=${PHISHING_ML}" \
  -var="attachment_scan_image_uri=${ATTACHMENT_SCAN}" \
  -var="aggregate_verdicts_image_uri=${AGGREGATE_VERDICTS}" \
  -var="web_server_image_uri=${WEB_SERVER}"

AWS_ENDPOINT_URL="$ENDPOINT" AWS_DEFAULT_REGION="$REGION" LOCAL_PREFIX="$PREFIX" \
  "$ROOT/scripts/ensure_local_pipeline.py"

AWS_ENDPOINT_URL="$ENDPOINT" AWS_DEFAULT_REGION="$REGION" LOCAL_PREFIX="$PREFIX" \
  "$ROOT/scripts/ensure_local_tables.py"

echo "[local-deploy] API local server target: make local-api"
