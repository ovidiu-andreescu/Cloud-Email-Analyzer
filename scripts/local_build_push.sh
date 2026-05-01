#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUILD_DIR="$ROOT/.localstack-build"
ZIP_DIR="$BUILD_DIR/lambdas"

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

cat > "$ROOT/.localstack-images.env" <<'ENV'
init-ledger=
resolve-recipients=
parse-email=
phishing-ml=
attachment-scan=
aggregate-verdicts=
web-server=
ENV

echo "[local-build] ZIP packages are ready for LocalStack community mode"
