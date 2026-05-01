#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/docker/docker-compose.localstack.yaml"
LOCAL_ENDPOINT="${LOCAL_ENDPOINT:-http://localhost:4566}"
AWS_REGION="${AWS_REGION:-eu-central-1}"
LOCAL_PREFIX="${LOCAL_PREFIX:-cloud-email-analyzer-local-dev}"
LOCAL_LAMBDA_MODE="${LOCAL_LAMBDA_MODE:-image}"
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
export LOCAL_LAMBDA_MODE

if [[ "$LOCAL_LAMBDA_MODE" == "image" ]]; then
  export LOCALSTACK_IMAGE="${LOCALSTACK_IMAGE:-localstack/localstack-pro:2026.3.0}"
else
  export LOCALSTACK_IMAGE="${LOCALSTACK_IMAGE:-localstack/localstack:3.8.1}"
fi

start_demo() {
  cd "$ROOT_DIR"
  make local-up
  wait_for_localstack
  reset_failed_localstack_lambdas
  make local-build
  make local-deploy
  populate_demo
  make local-ui
  printf "\nDashboard: http://localhost:5173/login\nAPI:       http://localhost:8000/\n"
}

reset_failed_localstack_lambdas() {
  local failed="" name state update_status
  local lambda_names=(
    "${LOCAL_PREFIX}-init-ledger"
    "${LOCAL_PREFIX}-resolve-recipients"
    "${LOCAL_PREFIX}-parse-email"
    "${LOCAL_PREFIX}-phishing-ml"
    "${LOCAL_PREFIX}-attachment-scan"
    "${LOCAL_PREFIX}-aggregate-verdicts"
  )

  for name in "${lambda_names[@]}"; do
    state="$(
      AWS_ACCESS_KEY_ID=test \
      AWS_SECRET_ACCESS_KEY=test \
      AWS_DEFAULT_REGION="$AWS_REGION" \
        aws --endpoint-url="$LOCAL_ENDPOINT" lambda get-function-configuration \
          --function-name "$name" \
          --query "State" \
          --output text 2>/dev/null || true
    )"
    update_status="$(
      AWS_ACCESS_KEY_ID=test \
      AWS_SECRET_ACCESS_KEY=test \
      AWS_DEFAULT_REGION="$AWS_REGION" \
        aws --endpoint-url="$LOCAL_ENDPOINT" lambda get-function-configuration \
          --function-name "$name" \
          --query "LastUpdateStatus" \
          --output text 2>/dev/null || true
    )"
    if [[ "$state" == "Failed" || "$update_status" == "Failed" ]]; then
      failed="${failed}${failed:+ }${name}"
    fi
  done

  if [[ -z "$failed" ]]; then
    return 0
  fi

  printf "Detected failed LocalStack Lambda state: %s\n" "$failed"
  printf "Resetting LocalStack local data because failed image Lambdas cannot always be deleted cleanly.\n"
  stop_demo
  make local-up
  wait_for_localstack
}

wait_for_localstack() {
  printf "Waiting for LocalStack at %s" "$LOCAL_ENDPOINT"
  for _ in $(seq 1 60); do
    if curl -fsS "$LOCAL_ENDPOINT/_localstack/info" >/dev/null 2>&1; then
      printf "\n"
      return 0
    fi
    printf "."
    sleep 2
  done
  printf "\nLocalStack did not become ready at %s\n" "$LOCAL_ENDPOINT" >&2
  return 1
}

populate_demo() {
  cd "$ROOT_DIR"
  AWS_ENDPOINT_URL="$LOCAL_ENDPOINT" \
    AWS_DEFAULT_REGION="$AWS_REGION" \
    LOCAL_PREFIX="$LOCAL_PREFIX" \
    DEMO_POPULATION_FILE="$ROOT_DIR/fixtures/demo_population.json" \
    python3 "$ROOT_DIR/scripts/populate_demo.py"
}

stop_demo() {
  cd "$ROOT_DIR"
  docker compose -f "$COMPOSE_FILE" down -v --remove-orphans
  docker rm -f local-email-analyzer-frontend >/dev/null 2>&1 || true
  docker rm -f local-email-analyzer-api >/dev/null 2>&1 || true
  docker rm -f localstack >/dev/null 2>&1 || true
  printf "\nStopped demo containers and cleared the LocalStack data volume.\n"
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
  populate)
    populate_demo
    ;;
  stop)
    stop_demo
    ;;
  status)
    status_demo
    ;;
  *)
    printf "Usage: %s {start|populate|stop|status}\n" "$0" >&2
    exit 2
    ;;
esac
