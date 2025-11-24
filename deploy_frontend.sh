#!/usr/bin/env bash
set -euo pipefail

# --- 1. Define Your Resources ---
# (I got this bucket name from your Terraform error log)
FRONTEND_BUCKET="cloud-email-analyzer-dev-frontend-9298bc"

# Get the CloudFront Distribution ID from your Terraform output
# This assumes your terraform is in the 'infra/' folder
echo "--- Fetching CloudFront Distribution ID from Terraform ---"
TF_STATE_DIR="./infra"
DISTRIBUTION_ID=$(terraform -chdir="$TF_STATE_DIR" output -raw cloudfront_distribution_id)

if [ -z "$DISTRIBUTION_ID" ]; then
    echo "Error: Could not get 'cloudfront_distribution_id' from terraform output."
    echo "Make sure you have this in your infra/outputs.tf:"
    echo 'output "cloudfront_distribution_id" { value = aws_cloudfront_distribution.s3_distribution.id }'
    exit 1
fi

echo "Deploying to Bucket: $FRONTEND_BUCKET"
echo "CloudFront ID: $DISTRIBUTION_ID"


# --- 2. Build Your React App ---
echo -e "\n--- Building React App (npm run build) ---"
pushd frontend >/dev/null
npm run build
popd >/dev/null
echo "Build complete."


# --- 3. Sync Files to S3 ---
# This syncs the *contents* of the 'dist' folder to the root of the S3 bucket
# The --delete flag removes old files from S3 (like old .js chunks)
echo -e "\n--- Syncing 'dist' folder to S3 Bucket ---"
aws s3 sync ./frontend/dist/ "s3://${FRONTEND_BUCKET}/" --delete
echo "S3 sync complete."


# --- 4. Invalidate CloudFront Cache ---
# This is CRITICAL. It tells CloudFront to fetch your new 'index.html'
# and other files, so users see the new version.
echo -e "\n--- Invalidating CloudFront Cache ---"
aws cloudfront create-invalidation \
    --distribution-id "$DISTRIBUTION_ID" \
    --paths "/*"
echo "CloudFront invalidation created. Your site will be updated globally in a few minutes."
echo -e "\n--- Frontend Deploy Complete! ---"
