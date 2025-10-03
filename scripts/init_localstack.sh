#!/usr/bin/env bash
set -Eeuo pipefail

echo "[init] LocalStack + Terraform (local_dev)"

export AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID:-test}"
export AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY:-test}"
export AWS_DEFAULT_REGION="${AWS_DEFAULT_REGION:-eu-central-1}"
export TF_IN_AUTOMATION=1

cd /app/infra/terraform

terraform init -reconfigure -backend=false

terraform workspace select local-dev || terraform workspace new local-dev

terraform apply \
  -input=false \
  -auto-approve \
  -var-file="../env/local_dev/terraform.tfvars"

echo "[done] LocalStack initialized successfully."
