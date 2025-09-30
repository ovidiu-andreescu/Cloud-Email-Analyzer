#!/usr/bin/env bash
set -euo pipefail

MODE="${1:-unit}"

for d in /app/libs/* /app/services/*; do
  if [ -f "$d/pyproject.toml" ]; then
    echo "Editable install: $d"
    pip install -e "$d"
  fi
done

export AWS_ENDPOINT_URL="${LOCALSTACK_ENDPOINT:-http://localhost:4566}"

if [ "$MODE" = "unit" ]; then
  pytest -m "not integration"
elif [ "$MODE" = "integration" ]; then
  pytest -m integration
else
  pytest
fi
