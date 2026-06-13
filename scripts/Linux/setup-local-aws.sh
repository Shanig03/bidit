#!/bin/bash
# scripts/setup-local-aws.sh

echo "Starting Local AWS Infrastructure Setup..."

# Fetch Account ID to ensure the dev bucket is globally unique
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
DEV_BUCKET="bidit-auction-images-dev-${ACCOUNT_ID}"
REGION="us-east-1"

echo "Configuring for Account: $ACCOUNT_ID"

# 1. Create DynamoDB Tables
echo "Creating DynamoDB Tables..."

aws dynamodb create-table \
  --table-name Users \
  --attribute-definitions AttributeName=userId,AttributeType=S \
  --key-schema AttributeName=userId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region $REGION 2>/dev/null || echo "Users table already exists."

aws dynamodb create-table \
  --table-name Auctions \
  --attribute-definitions AttributeName=auctionId,AttributeType=S \
  --key-schema AttributeName=auctionId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region $REGION 2>/dev/null || echo "Auctions table already exists."

aws dynamodb create-table \
  --table-name Bids \
  --attribute-definitions \
    AttributeName=auctionId,AttributeType=S \
    AttributeName=placedAt,AttributeType=S \
    AttributeName=bidderId,AttributeType=S \
  --key-schema \
    AttributeName=auctionId,KeyType=HASH \
    AttributeName=placedAt,KeyType=RANGE \
  --global-secondary-indexes \
    "IndexName=bidderId-placedAt-index,KeySchema=[{AttributeName=bidderId,KeyType=HASH},{AttributeName=placedAt,KeyType=RANGE}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5}" \
  --billing-mode PAY_PER_REQUEST \
  --region $REGION 2>/dev/null || echo "Bids table already exists."

aws dynamodb create-table \
  --table-name Notifications \
  --attribute-definitions \
    AttributeName=userId,AttributeType=S \
    AttributeName=notificationId,AttributeType=S \
  --key-schema \
    AttributeName=userId,KeyType=HASH \
    AttributeName=notificationId,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --region $REGION 2>/dev/null || echo "Notifications table already exists."

# 2. Create S3 Bucket for Development
echo "Creating Dev S3 Bucket: $DEV_BUCKET..."

aws s3 mb s3://$DEV_BUCKET --region $REGION 2>/dev/null || echo "Bucket already exists."

aws s3api put-bucket-versioning \
  --bucket $DEV_BUCKET \
  --versioning-configuration Status=Enabled

aws s3api put-bucket-cors \
  --bucket $DEV_BUCKET \
  --cors-configuration file://s3-cors-config.json

echo "======================================================="
echo "✅ Local AWS setup complete!"
echo "⚠️ IMPORTANT: Update your local lambdas/.env.lambda file with this bucket name:"
echo "BUCKET_NAME=$DEV_BUCKET"
echo "======================================================="