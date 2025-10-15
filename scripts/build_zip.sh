#!/usr/bin/env bash
set -euo pipefail

SERVICE="${1:-}"
if [[ -z "$SERVICE" ]]; then
  echo "Usage: scripts/build_zip.sh <init_ledger|parse_email|extract_attachments>"
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ARTIFACTS="$ROOT_DIR/artifacts"
STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT

cp -r "$ROOT_DIR/services/$SERVICE/src/$SERVICE" "$STAGE/$SERVICE"

cp -r "$ROOT_DIR/libs/common/src/services_common" "$STAGE/services_common"

mkdir -p "$ARTIFACTS"
pushd "$STAGE" >/dev/null
zip -qr "$ARTIFACTS/${SERVICE}.zip" "$SERVICE" "services_common"
popd >/dev/null

echo "Built $ARTIFACTS/${SERVICE}.zip"
