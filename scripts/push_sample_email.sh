#!/usr/bin/env bash
set -euo pipefail
BUCKET="${1:-}"
KEY="${2:-emails/sample-1.eml}"
FILE="${3:-tests/fixtures/sample.eml}"

if [[ -z "$BUCKET" ]]; then
  echo "Usage: scripts/push_sample_email.sh <bucket> [key=emails/sample-1.eml] [file=tests/fixtures/sample.eml]"
  exit 1
fi

if command -v awslocal >/dev/null 2>&1; then
  awslocal s3 cp "$FILE" "s3://$BUCKET/$KEY"
else
  : "${AWS_ENDPOINT_URL:=http://localhost:4566}"
  aws s3 cp "$FILE" "s3://$BUCKET/$KEY" --endpoint-url "$AWS_ENDPOINT_URL"
fi

echo "Uploaded $FILE → s3://$BUCKET/$KEY"
