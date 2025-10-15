#!/usr/bin/env bash
set -euo pipefail

ENV="${ENV:-dev}"                          # dev | prod
REGION="${AWS_REGION:-eu-central-1}"
TAG="${TAG:-latest}"
PROJECT="${PROJECT:-cloud-email-analyzer}"
PLATFORM="${PLATFORM:-linux/amd64}"        # linux/amd64 or linux/arm64
FORCE_CLASSIC="${FORCE_CLASSIC:-0}"        # 1 = disable buildx, classic docker build
SKOPEO_FORCE="${SKOPEO_FORCE:-0}"          # 1 = if manifest is OCI, convert in-place to Docker v2 using skopeo

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

TF_DIR="$ROOT/infra/terraform"
TFVARS_FILE="$ROOT/infra/env/${ENV}/terraform.tfvars"

CTX_INIT="${CTX_INIT:-$ROOT/services/init_ledger}"
CTX_PARSE="${CTX_PARSE:-$ROOT/services/parse_email}"
CTX_EXTR="${CTX_EXTR:-$ROOT/services/extract_attachments}"

ecr_sanitize() {
  local s="$1"
  s="${s,,}"
  s="$(printf '%s' "$s" | sed -E 's|[^a-z0-9._/-]+|-|g')"
  s="$(printf '%s' "$s" | sed -E 's|[._-]{2,}|-|g')"
  s="$(printf '%s' "$s" | sed -E 's|^[-._/]+||; s|[-._/]+$||')"
  [[ -z "$s" ]] && { echo "invalid-ecr-name"; return; }
  printf '%s' "$s"
}

BASE_NAME="$(ecr_sanitize "$PROJECT")"
ENV_SAFE="$(ecr_sanitize "$ENV")"

REPO_INIT="$(ecr_sanitize "${BASE_NAME}-${ENV_SAFE}-init-ledger")"
REPO_PARSE="$(ecr_sanitize "${BASE_NAME}-${ENV_SAFE}-parse-email")"
REPO_EXTR="$(ecr_sanitize "${BASE_NAME}-${ENV_SAFE}-extract-attachments")"

command -v aws >/dev/null || { echo "  aws CLI not found"; exit 1; }
command -v docker >/dev/null || { echo "  docker not found"; exit 1; }

[[ -d "$TF_DIR" ]] || { echo "  Terraform dir not found: $TF_DIR"; exit 1; }
[[ -f "$TFVARS_FILE" ]] || { echo "  tfvars not found: $TFVARS_FILE"; exit 1; }

[[ -f "$CTX_INIT/Dockerfile" ]]  || { echo "  Dockerfile missing: $CTX_INIT/Dockerfile"; exit 1; }
[[ -f "$CTX_PARSE/Dockerfile" ]] || { echo "  Dockerfile missing: $CTX_PARSE/Dockerfile"; exit 1; }
[[ -f "$CTX_EXTR/Dockerfile" ]]  || { echo "  Dockerfile missing: $CTX_EXTR/Dockerfile"; exit 1; }

unset TF_VAR_localstack_endpoint AWS_ENDPOINT_URL

echo "  Checking AWS caller identity..."
ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text --region "$REGION")"
echo "   Account: $ACCOUNT_ID  Region: $REGION  Env: $ENV  Tag: $TAG"

REGISTRY="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com"
IMG_INIT="${REGISTRY}/${REPO_INIT}:${TAG}"
IMG_PARSE="${REGISTRY}/${REPO_PARSE}:${TAG}"
IMG_EXTR="${REGISTRY}/${REPO_EXTR}:${TAG}"

echo "ECR repos:"
echo "  INIT : ${REPO_INIT}"
echo "  PARSE: ${REPO_PARSE}"
echo "  EXTR : ${REPO_EXTR}"

echo "  Logging into ECR..."
aws ecr get-login-password --region "$REGION" | docker login --username AWS --password-stdin "$REGISTRY"

ensure_repo () {
  local name="$1"
  aws ecr describe-repositories --repository-names "$name" --region "$REGION" >/dev/null 2>&1 \
    || aws ecr create-repository --repository-name "$name" --region "$REGION" >/dev/null
}
ensure_repo "$REPO_INIT"
ensure_repo "$REPO_PARSE"
ensure_repo "$REPO_EXTR"

pick_context_for_dockerfile () {
  local dockerfile_path="$1"
  if grep -Eiq '^[[:space:]]*COPY[[:space:]]+(libs/|services/)' "$dockerfile_path"; then
    echo "$ROOT"
  else
    echo "$(cd "$(dirname "$dockerfile_path")" && pwd)"
  fi
}

check_manifest_type () {
  local repo_name="$1" tag="$2"
  aws ecr describe-images \
    --repository-name "$repo_name" \
    --region "$REGION" \
    --image-ids imageTag="$tag" \
    --query 'imageDetails[0].imageManifestMediaType' \
    --output text 2>/dev/null || true
}

maybe_convert_with_skopeo () {
  local repo="$1" tag="$2"
  if [[ "$SKOPEO_FORCE" == "1" ]]; then
    if ! command -v skopeo >/dev/null 2>&1; then
      echo "   SKOPEO_FORCE=1 but skopeo not found; skipping conversion."
      return 1
    fi
    echo "  Converting OCI → Docker v2 using skopeo for ${repo}:${tag} ..."
    # Re-login for skopeo
    aws ecr get-login-password --region "$REGION" | skopeo login --username AWS --password-stdin "$REGISTRY" >/dev/null
    skopeo copy --format v2s2 \
      "docker://${repo}:${tag}" \
      "docker://${repo}:${tag}"
    return 0
  fi
  return 1
}

# Build & push single-arch Docker schema v2 image
build_push_lambda () {
  local service_dir="$1" repo="$2" tag="$3" service_name="$4"
  local dockerfile="$service_dir/Dockerfile"
  local ctx; ctx="$(pick_context_for_dockerfile "$dockerfile")"

  echo "  Building $service_name"
  echo "  Dockerfile: $dockerfile"
  echo "  Context   : $ctx"
  echo "  Platform  : $PLATFORM"

  if [[ "$FORCE_CLASSIC" == "1" ]]; then
    echo "→ classic docker build (BuildKit off)"
    DOCKER_BUILDKIT=0 docker build \
      --no-cache --pull \
      --platform="$PLATFORM" \
      -f "$dockerfile" \
      -t "${repo}:${tag}" \
      "$ctx"
    docker push "${repo}:${tag}"
  else
    if docker buildx version >/dev/null 2>&1; then
      # Ensure a usable buildx instance
      if ! docker buildx inspect lambda-builder >/dev/null 2>&1; then
        docker buildx create --name lambda-builder --use >/dev/null
      else
        docker buildx use lambda-builder >/dev/null
      fi

      docker buildx build \
        --no-cache --pull \
        --platform="$PLATFORM" \
        -f "$dockerfile" \
        -t "${repo}:${tag}" \
        --provenance=false --sbom=false \
        --output=type=registry,oci-mediatypes=false \
        "$ctx"
    else
      echo "→ buildx not available; using classic docker"
      DOCKER_BUILDKIT=0 docker build \
        --no-cache --pull \
        --platform="$PLATFORM" \
        -f "$dockerfile" \
        -t "${repo}:${tag}" \
        "$ctx"
      docker push "${repo}:${tag}"
    fi
  fi

  local media
  media="$(check_manifest_type "$(basename "$repo")" "$tag")"
  echo "  imageManifestMediaType: ${media:-<empty>}"

  if [[ "$media" != "application/vnd.docker.distribution.manifest.v2+json" ]]; then
    echo "  tag '$tag' on $(basename "$repo") is NOT docker schema v2 (got: '$media')."
    if maybe_convert_with_skopeo "$repo" "$tag"; then
      media="$(check_manifest_type "$(basename "$repo")" "$tag")"
      echo "  after skopeo, imageManifestMediaType: ${media:-<empty>}"
    fi
  fi

  if [[ "$media" != "application/vnd.docker.distribution.manifest.v2+json" ]]; then
    echo "   Still not Docker schema v2. Lambda will reject it."
    echo "   Try: FORCE_CLASSIC=1 or ensure buildx path uses --output=type=registry,oci-mediatypes=false (already set)."
    exit 1
  fi

  echo "Pushed ${repo}:${tag} (Docker schema v2)"
}

build_push_lambda "$CTX_INIT"  "$REGISTRY/$REPO_INIT"  "$TAG" "init_ledger"
build_push_lambda "$CTX_PARSE" "$REGISTRY/$REPO_PARSE" "$TAG" "parse_email"
build_push_lambda "$CTX_EXTR"  "$REGISTRY/$REPO_EXTR"  "$TAG" "extract_attachments"

echo "  Waiting a moment for ECR indexing..."
sleep 5

echo "Terraform apply ($TF_DIR)"
pushd "$TF_DIR" >/dev/null
terraform init -upgrade -reconfigure
terraform workspace select "$ENV" >/dev/null 2>&1 || terraform workspace new "$ENV"

terraform apply -auto-approve \
  -var-file="$TFVARS_FILE" \
  -var="env=${ENV}" \
  -var="region=${REGION}" \
  -var="init_ledger_image_uri=${IMG_INIT}" \
  -var="parse_email_image_uri=${IMG_PARSE}" \
  -var="extract_attachments_image_uri=${IMG_EXTR}" \

popd >/dev/null
echo "  Deploy complete."
echo "  - $IMG_INIT"
echo "  - $IMG_PARSE"
echo "  - $IMG_EXTR"
