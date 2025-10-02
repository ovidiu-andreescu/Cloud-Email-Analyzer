#!/usr/bin/env bash
set -euo pipefail

MODE="${1:-unit}"

export AWS_ENDPOINT_URL="${LOCALSTACK_ENDPOINT:-http://localhost:4566}"

source /opt/venv/bin/activate

if [ "$MODE" = "unit" ]; then
  pytest -m "not integration" -v tests/
elif [ "$MODE" = "integration" ]; then
  pytest -m integration -v tests/
else
  pytest -v tests/
fi