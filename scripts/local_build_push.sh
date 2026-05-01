#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUILD_DIR="$ROOT/.localstack-build"
ZIP_DIR="$BUILD_DIR/lambdas"
IMAGE_ENV="$ROOT/.localstack-images.env"
MODE="${LOCAL_LAMBDA_MODE:-image}"
ENDPOINT="${LOCALSTACK_ENDPOINT:-${AWS_ENDPOINT_URL:-http://localhost:4566}}"
REGION="${AWS_REGION:-${AWS_DEFAULT_REGION:-eu-central-1}}"
PREFIX="${LOCAL_PREFIX:-cloud-email-analyzer-local-dev}"
IMAGE_TAG="${LOCAL_IMAGE_TAG:-local-pro}"
IMAGE_PLATFORM="${LOCAL_IMAGE_PLATFORM:-linux/amd64}"

lambda_names=(
  "init-ledger"
  "resolve-recipients"
  "parse-email"
  "phishing-ml"
  "attachment-scan"
  "aggregate-verdicts"
)

stage_common() {
  local stage="$1"
  mkdir -p "$stage"
  cp -R "$ROOT/libs/common/src/services_common" "$stage/services_common"
}

zip_stage() {
  local stage="$1"
  local output="$2"
  (
    cd "$stage"
    python3 -m zipfile -c "$output" .
  )
}

package_src_lambda() {
  local name="$1"
  local package_dir="$2"
  local src_dir="$3"
  local stage="$BUILD_DIR/stage/$name"

  rm -rf "$stage"
  mkdir -p "$stage"
  stage_common "$stage"
  cp -R "$ROOT/$src_dir/$package_dir" "$stage/$package_dir"
  zip_stage "$stage" "$ZIP_DIR/$name.zip"
  echo "[local-build] packaged $ZIP_DIR/$name.zip"
}

package_file_lambda() {
  local name="$1"
  local source_file="$2"
  local target_file="$3"
  local stage="$BUILD_DIR/stage/$name"

  rm -rf "$stage"
  mkdir -p "$stage"
  stage_common "$stage"
  cp "$ROOT/$source_file" "$stage/$target_file"
  zip_stage "$stage" "$ZIP_DIR/$name.zip"
  echo "[local-build] packaged $ZIP_DIR/$name.zip"
}

rm -rf "$BUILD_DIR/stage" "$ZIP_DIR"
mkdir -p "$ZIP_DIR"

package_src_lambda "init-ledger" "init_ledger" "services/init_ledger/src"
package_src_lambda "resolve-recipients" "resolve_recipients" "services/resolve_recipients/src"
package_src_lambda "parse-email" "parse_email" "services/parse_email/src"
package_file_lambda "phishing-ml" "services/phishing_ml_predict/handler.py" "handler.py"
package_file_lambda "attachment-scan" "services/clamav_virus_scan/lambda.py" "clamav_scan.py"
package_src_lambda "aggregate-verdicts" "aggregate_verdicts" "services/aggregate_verdicts/src"

aws_local() {
  AWS_ACCESS_KEY_ID=test \
  AWS_SECRET_ACCESS_KEY=test \
  AWS_DEFAULT_REGION="$REGION" \
    aws --endpoint-url="$ENDPOINT" "$@" --region "$REGION" --output json
}

json_value() {
  local expression="$1"
  python3 -c "import json,sys; data=json.load(sys.stdin); value=$expression; print(value or '')"
}

require_localstack_pro() {
  local info
  info="$(curl -sS "$ENDPOINT/_localstack/info" 2>/dev/null || true)"
  if [[ -z "$info" ]]; then
    echo "LocalStack is not reachable at $ENDPOINT. Run make local-up first."
    exit 1
  fi
  if ! python3 -c "import json,sys; data=json.load(sys.stdin); sys.exit(0 if data.get('is_license_activated') else 1)" <<< "$info"; then
    echo "LOCAL_LAMBDA_MODE=image requires an activated LocalStack Pro license."
    echo "Use LOCAL_LAMBDA_MODE=zip for the future local-free fallback path."
    exit 1
  fi
}

dockerfile_for() {
  case "$1" in
    init-ledger) echo "$ROOT/services/init_ledger/Dockerfile" ;;
    resolve-recipients) echo "$ROOT/services/resolve_recipients/Dockerfile" ;;
    parse-email) echo "$ROOT/services/parse_email/Dockerfile" ;;
    phishing-ml) echo "$ROOT/services/phishing_ml_predict/Dockerfile" ;;
    attachment-scan) echo "$ROOT/services/clamav_virus_scan/Dockerfile" ;;
    aggregate-verdicts) echo "$ROOT/services/aggregate_verdicts/Dockerfile" ;;
    *) echo "unknown lambda image: $1" >&2; return 1 ;;
  esac
}

ensure_repo_uri() {
  local name="$1"
  local repo="${PREFIX}-${name}"
  aws_local ecr create-repository --repository-name "$repo" >/dev/null 2>&1 || true
  aws_local ecr describe-repositories --repository-names "$repo" \
    | json_value "data['repositories'][0]['repositoryUri']"
}

push_lambda_image() {
  local name="$1"
  local dockerfile repo_uri local_tag
  dockerfile="$(dockerfile_for "$name")"
  repo_uri="$(ensure_repo_uri "$name")"
  if [[ -z "$repo_uri" ]]; then
    echo "Unable to resolve LocalStack ECR repository URI for $name"
    exit 1
  fi

  local_tag="${PREFIX}-${name}:${IMAGE_TAG}"
  echo "[local-build] building image $local_tag"
  docker build --platform "$IMAGE_PLATFORM" -f "$dockerfile" -t "$local_tag" "$ROOT"
  docker tag "$local_tag" "${repo_uri}:${IMAGE_TAG}"
  docker push "${repo_uri}:${IMAGE_TAG}"
  printf "%s=%s:%s\n" "$name" "$repo_uri" "$IMAGE_TAG" >> "$IMAGE_ENV"
}

case "$MODE" in
  zip)
    echo "[local-build] ZIP packages are ready for the experimental local-free mode."
    echo "[local-build] Note: ZIP mode does not yet include real ClamAV or packaged ML artifacts."
    exit 0
    ;;
  image)
    require_localstack_pro
    : > "$IMAGE_ENV"
    for name in "${lambda_names[@]}"; do
      push_lambda_image "$name"
    done
    printf "web-server=\n" >> "$IMAGE_ENV"
    echo "[local-build] Lambda images pushed for LocalStack Pro mode"
    ;;
  *)
    echo "LOCAL_LAMBDA_MODE must be image or zip, got: $MODE"
    exit 2
    ;;
esac

echo "[local-build] ZIP packages are also available for LOCAL_LAMBDA_MODE=zip"
