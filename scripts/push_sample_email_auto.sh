#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TF_DIR="$ROOT/infra/terraform"

BUCKET="$(terraform -chdir="$TF_DIR" output -raw inbound_bucket)"
KEY="emails/test-$(date +%s).eml"
FILE="${1:-$ROOT/tests/fixtures/sample.eml}"

if command -v awslocal >/dev/null 2>&1; then
  awslocal s3 cp "$FILE" "s3://$BUCKET/$KEY"
else
  : "${AWS_ENDPOINT_URL:=http://localhost:4566}"
  aws s3 cp "$FILE" "s3://$BUCKET/$KEY" --endpoint-url "$AWS_ENDPOINT_URL"
fi

echo "Uploaded $FILE → s3://$BUCKET/$KEY"
