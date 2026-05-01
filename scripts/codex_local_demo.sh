#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/docker/docker-compose.localstack.yaml"
LOCAL_ENDPOINT="${LOCAL_ENDPOINT:-http://localhost:4566}"
AWS_REGION="${AWS_REGION:-eu-central-1}"
LOCAL_PREFIX="${LOCAL_PREFIX:-cloud-email-analyzer-local-dev}"
TOKEN_FILE="$ROOT_DIR/.env.localstack"

if [ -f "$TOKEN_FILE" ]; then
  set -a
  # shellcheck disable=SC1090
  . "$TOKEN_FILE"
  set +a
fi

NODE_BIN="$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin"
if [ -d "$NODE_BIN" ]; then
  export PATH="$NODE_BIN:$PATH"
fi

export LOCAL_ENDPOINT AWS_REGION LOCAL_PREFIX

messages_table_exists() {
  AWS_ENDPOINT_URL="$LOCAL_ENDPOINT" AWS_DEFAULT_REGION="$AWS_REGION" \
    aws dynamodb describe-table --table-name "$LOCAL_PREFIX-messages" >/dev/null 2>&1
}

message_count() {
  AWS_ENDPOINT_URL="$LOCAL_ENDPOINT" AWS_DEFAULT_REGION="$AWS_REGION" \
    aws dynamodb scan --table-name "$LOCAL_PREFIX-messages" --select COUNT \
      --query Count --output text 2>/dev/null || printf "0"
}

start_demo() {
  cd "$ROOT_DIR"
  make local-up
  make local-build
  make local-deploy
  make local-create-users

  if messages_table_exists && [ "$(message_count)" = "0" ]; then
    make local-seed-phishing
    make local-seed-eicar
  fi

  make local-ui
  printf "\nDashboard: http://localhost:5173/login\nAPI:       http://localhost:8000/\n"
}

stop_demo() {
  cd "$ROOT_DIR"
  docker compose -f "$COMPOSE_FILE" down --remove-orphans
  docker rm -f local-email-analyzer-frontend >/dev/null 2>&1 || true
  docker rm -f local-email-analyzer-api >/dev/null 2>&1 || true
  docker rm -f localstack >/dev/null 2>&1 || true
}

status_demo() {
  docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' \
    --filter name=localstack \
    --filter name=local-email-analyzer-api \
    --filter name=local-email-analyzer-frontend
}

case "${1:-start}" in
  start)
    start_demo
    ;;
  stop)
    stop_demo
    ;;
  status)
    status_demo
    ;;
  *)
    printf "Usage: %s {start|stop|status}\n" "$0" >&2
    exit 2
    ;;
esac
