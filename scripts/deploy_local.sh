#!/usr/bin/env bash
set -euo pipefail

ENV="${ENV:-local-dev}"
REGION="${AWS_REGION:-eu-central-1}"
TAG="${TAG:-latest}"
PROJECT="${PROJECT:-cloud-email-analyzer}"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TF_DIR="$ROOT/../infra/terraform"
TFVARS_FILE="$ROOT/../infra/env/${ENV}/terraform.tfvars"

CTX_INIT="${CTX_INIT:-$ROOT/../services/init_ledger}"
CTX_PARSE="${CTX_PARSE:-$ROOT/../services/parse_email}"
CTX_EXTR="${CTX_EXTR:-$ROOT/../services/extract_attachments}"

REPO_INIT="${PROJECT}-${ENV}-init-ledger"
REPO_PARSE="${PROJECT}-${ENV}-parse-email"
REPO_EXTR="${PROJECT}-${ENV}-extract-attachments"


pushd "$TF_DIR" >/dev/null
terraform init -upgrade -reconfigure
terraform workspace select "$ENV" >/dev/null 2>&1 || terraform workspace new "$ENV"
terraform apply -auto-approve \
  -var-file="$TFVARS_FILE" \
  -var="env=${ENV}" \
  -var="region=${REGION}" \
  -var="init_ledger_image_uri=" \
  -var="parse_email_image_uri=" \
  -var="extract_attachments_image_uri="
popd >/dev/null
