# BidIt - Production Deployment Guide

This guide covers deploying BidIt to production on AWS with proper security, monitoring, and best practices.

## Quick Start - Zero Console Clicks

```bash
# 1. Deploy infrastructure (CloudFormation)
aws cloudformation create-stack \
  --stack-name bidit-prod \
  --template-body file://bidit-stack.yaml \
  --parameters ParameterKey=Environment,ParameterValue=prod \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1

# 2. Deploy all Lambda functions
chmod +x deploy-lambdas.sh
./deploy-lambdas.sh

# 3. Store secrets
aws secretsmanager create-secret \
  --name bidit/agora/cert \
  --secret-string '{"cert": "your-agora-app-certificate"}'

# 4. Deploy frontend
chmod +x deploy-frontend.sh
./deploy-frontend.sh

# 5. Run smoke tests
chmod +x smoke-tests.sh
./smoke-tests.sh
```

---

## Pre-Deployment Checklist

- [ ] All code is merged and tested
- [ ] Environment variables are configured in AWS Secrets Manager
- [ ] DynamoDB tables are backed up
- [ ] CORS settings are restricted to production domain(s)
- [ ] Firebase security rules are production-ready
- [ ] CloudWatch logs and alarms are configured

---

## Infrastructure as Code (CloudFormation)

See `bidit-stack.yaml` for the complete CloudFormation template that creates:
- DynamoDB tables (Users, Auctions, Bids, Notifications)
- S3 bucket with encryption and versioning
- IAM roles and policies
- CloudWatch logs and alarms
- Step Functions role

**Deploy:**
```bash
aws cloudformation create-stack \
  --stack-name bidit-prod \
  --template-body file://bidit-stack.yaml \
  --parameters ParameterKey=Environment,ParameterValue=prod \
  --capabilities CAPABILITY_NAMED_IAM
```

---

## Lambda Deployment

Use the provided `deploy-lambdas.sh` script to deploy all 21 Lambda functions:

```bash
#!/bin/bash
# deploy-lambdas.sh

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION="us-east-1"

LAMBDA_FUNCTIONS=(
  "createUser"
  "updateUserProfile"
  "getAllUsers"
  "updateUserStatus"
  "updateUserRole"
  "getAllAuctions"
  "getAuction"
  "createAuction"
  "updateAuction"
  "deleteAuction"
  "placeBid"
  "getAuctionBids"
  "getUserBids"
  "addToFavorites"
  "getFavorites"
  "removeAuctionFromFavorites"
  "getNotifications"
  "generateS3ImageUrls"
  "generateAgoraToken"
  "CheckAuctionStatus"
  "ProcessAuctionWinner"
)

for func in "${LAMBDA_FUNCTIONS[@]}"; do
  echo "Deploying $func..."
  cd "lambdas"
  zip -q -r "../${func}.zip" "${func}.py" -x "*.git*"
  cd ..
  
  if aws lambda get-function --function-name "$func" --region "$REGION" 2>/dev/null; then
    aws lambda update-function-code \
      --function-name "$func" \
      --zip-file "fileb://${func}.zip" \
      --region "$REGION"
  else
    aws lambda create-function \
      --function-name "$func" \
      --runtime python3.11 \
      --role "arn:aws:iam::${ACCOUNT_ID}:role/BiditLambdaExecutionRole" \
      --handler "${func}.lambda_handler" \
      --zip-file "fileb://${func}.zip" \
      --timeout 60 \
      --memory-size 256 \
      --region "$REGION"
  fi
  
  rm "${func}.zip"
done

echo "All Lambda functions deployed!"
```

**Run:**
```bash
chmod +x deploy-lambdas.sh
./deploy-lambdas.sh
```

---

## Secrets Management

```bash
# Store Agora certificate
aws secretsmanager create-secret \
  --name bidit/agora/cert \
  --secret-string '{"cert": "your-agora-app-certificate"}'

# Store database credentials
aws secretsmanager create-secret \
  --name bidit/database/credentials \
  --secret-string '{"username": "admin", "password": "secure-password"}'
```

---

## Frontend Deployment

```bash
#!/bin/bash
# deploy-frontend.sh

S3_BUCKET="bidit-frontend-prod"
DISTRIBUTION_ID="E1234567890ABC"

cd frontend
npm run build
cd ..

aws s3 sync frontend/dist/ "s3://${S3_BUCKET}/" \
  --delete \
  --cache-control "max-age=31536000" \
  --exclude "index.html"

aws s3 cp frontend/dist/index.html "s3://${S3_BUCKET}/index.html" \
  --cache-control "max-age=0, must-revalidate" \
  --content-type "text/html"

aws cloudfront create-invalidation \
  --distribution-id $DISTRIBUTION_ID \
  --paths "/*"

echo "Frontend deployed!"
```

**Run:**
```bash
chmod +x deploy-frontend.sh
./deploy-frontend.sh
```

---

## Database Backup

```bash
# Create backup before deployment
aws dynamodb create-backup \
  --table-name Auctions \
  --backup-name bidit-auctions-backup-$(date +%Y%m%d-%H%M%S)

# List backups
aws dynamodb list-backups

# Restore from backup
aws dynamodb restore-table-from-backup \
  --target-table-name AuctionsRestored \
  --backup-arn arn:aws:dynamodb:us-east-1:ACCOUNT_ID:table/Auctions/backup/01000000000000000
```

---

## Monitoring & Alarms

```bash
# Lambda error alarm
aws cloudwatch put-metric-alarm \
  --alarm-name bidit-lambda-errors \
  --alarm-description "Alert on Lambda function errors" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold

# DynamoDB throttling alarm
aws cloudwatch put-metric-alarm \
  --alarm-name bidit-dynamodb-throttle \
  --alarm-description "Alert on DynamoDB throttling" \
  --metric-name UserErrors \
  --namespace AWS/DynamoDB \
  --statistic Sum \
  --period 300 \
  --threshold 1 \
  --comparison-operator GreaterThanOrEqualToThreshold
```

---

## Security Hardening

```bash
# S3 encryption
aws s3api put-bucket-encryption \
  --bucket bidit-auction-images-2026 \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {"SSEAlgorithm": "AES256"}
    }]
  }'

# Block public access
aws s3api put-public-access-block \
  --bucket bidit-auction-images-2026 \
  --public-access-block-configuration \
  "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

# CORS (production domain only)
aws s3api put-bucket-cors \
  --bucket bidit-auction-images-2026 \
  --cors-configuration '{
    "CORSRules": [{
      "AllowedOrigins": ["https://yourdomain.com"],
      "AllowedMethods": ["GET", "PUT"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3000
    }]
  }'
```

---

## Rollback Procedures

```bash
# Lambda rollback
aws lambda update-alias \
  --function-name createAuction \
  --name prod \
  --function-version 5

# DynamoDB rollback
aws dynamodb restore-table-from-backup \
  --target-table-name AuctionsRollback \
  --backup-arn arn:aws:dynamodb:...

# Frontend rollback
aws cloudfront create-invalidation \
  --distribution-id $DISTRIBUTION_ID \
  --paths "/*"
```

---

## Smoke Tests

```bash
#!/bin/bash
# smoke-tests.sh

API_URL="https://api.yourdomain.com/dev"

echo "Testing auction list..."
curl -X GET "$API_URL/auctions"

echo "Testing Agora token..."
curl -X GET "$API_URL/agora/token?channelName=test&uid=123&isPublisher=true"

echo "Testing S3 upload URL..."
curl -X POST "$API_URL/upload-url" \
  -H "Content-Type: application/json" \
  -d '{"action": "get", "imageKey": "test-image.webp"}'

echo "Smoke tests complete!"
```

**Run:**
```bash
chmod +x smoke-tests.sh
./smoke-tests.sh
```

---

For detailed information, see [ARCHITECTURE.md](../ARCHITECTURE.md).
