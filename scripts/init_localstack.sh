#!/bin/bash
set -e

echo "Initializing LocalStack with local dev Terraform configuration..."

cd /app/infra/terraform/root

terraform init -backend-config="backend.hcl" -reconfigure

terraform workspace select local_dev || terraform workspace new local_dev

terraform apply -var-file="env/local_dev.tfvars" -auto-approve

echo "LocalStack initialized successfully."