#!/usr/bin/env bash
set -euo pipefail
FN="${1:-}"
if [[ -z "$FN" ]]; then
  echo "Usage: scripts/tail_lambda.sh <function-name>"
  exit 1
fi

STREAM="/aws/lambda/$FN"

if command -v awslocal >/dev/null 2>&1; then
  awslocal logs tail "$STREAM" --follow
else
  aws logs tail "$STREAM" --follow
fi
