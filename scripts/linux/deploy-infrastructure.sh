#!/usr/bin/env bash
set -euo pipefail
STACK_NAME="${STACK_NAME:-bidit-dev}"
REGION="${AWS_REGION:-${REGION:-us-east-1}}"
STAGE="${STAGE:-dev}"
ARTIFACT_BUCKET="${ARTIFACT_BUCKET:?Set ARTIFACT_BUCKET to an existing deployment S3 bucket}"
ARTIFACT_PREFIX="${ARTIFACT_PREFIX:-bidit-lambdas}"
IMAGES_BUCKET="${IMAGES_BUCKET:?Set IMAGES_BUCKET to a globally unique image bucket name}"
USE_EXISTING_LAB_ROLE="${USE_EXISTING_LAB_ROLE:-false}"
EXISTING_LAB_ROLE_ARN="${EXISTING_LAB_ROLE_ARN:-}"
AGORA_APP_ID="${AGORA_APP_ID:-}"
AGORA_APP_CERT="${AGORA_APP_CERT:-}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ZIP_DIR="$ROOT_DIR/.deploy/lambda-zips"
[[ -d "$ZIP_DIR" ]] || { echo "Missing $ZIP_DIR. Run scripts/linux/package-lambdas.sh first." >&2; exit 1; }
aws s3 sync "$ZIP_DIR/" "s3://$ARTIFACT_BUCKET/$ARTIFACT_PREFIX/" --region "$REGION"
aws cloudformation deploy \
  --template-file "$ROOT_DIR/cloudformation/bidit-infrastructure.yaml" \
  --stack-name "$STACK_NAME" \
  --region "$REGION" \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides \
    StageName="$STAGE" LambdaArtifactBucket="$ARTIFACT_BUCKET" LambdaArtifactPrefix="$ARTIFACT_PREFIX" \
    ImagesBucketName="$IMAGES_BUCKET" UseExistingLabRole="$USE_EXISTING_LAB_ROLE" ExistingLabRoleArn="$EXISTING_LAB_ROLE_ARN" \
    AgoraAppId="$AGORA_APP_ID" AgoraAppCertificate="$AGORA_APP_CERT"
aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$REGION" --query 'Stacks[0].Outputs' --output table
