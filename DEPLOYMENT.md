# BidIt - Production Deployment Guide

This guide covers deploying BidIt to production on AWS with proper security, monitoring, and best practices.

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Infrastructure as Code (IaC)](#infrastructure-as-code-iac)
3. [Secrets Management](#secrets-management)
4. [Lambda Deployment](#lambda-deployment)
5. [API Gateway Configuration](#api-gateway-configuration)
6. [Database Migration](#database-migration)
7. [Frontend Build and Deployment](#frontend-build-and-deployment)
8. [Monitoring and Logging](#monitoring-and-logging)
9. [Security Hardening](#security-hardening)
10. [Rollback Procedures](#rollback-procedures)
11. [Performance Optimization](#performance-optimization)
12. [Post-Deployment Verification](#post-deployment-verification)

---

## Pre-Deployment Checklist

Before deploying to production, ensure:

- [ ] All code is merged and tested on a staging branch
- [ ] Environment variables are configured in AWS Secrets Manager
- [ ] DynamoDB tables are backed up
- [ ] API Gateway authorizer is implemented (currently not enforced per documentation)
- [ ] CloudWatch logs and alarms are configured
- [ ] CORS settings are restricted to production domain(s)
- [ ] Firebase security rules are production-ready
- [ ] SSL/TLS certificates are valid
- [ ] Load testing has been performed
- [ ] Rollback plan is documented

---

## Infrastructure as Code (IaC)

### Option A: AWS CloudFormation (Recommended)

Create a CloudFormation template to define all AWS resources:

```yaml
# bidit-stack.yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'BidIt Live Auction Marketplace Infrastructure'

Parameters:
  Environment:
    Type: String
    Default: prod
    AllowedValues:
      - dev
      - staging
      - prod
  AuctionImagesS3Bucket:
    Type: String
    Default: bidit-auction-images-2026

Resources:
  # IAM Role for Lambda
  BiditLambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: BiditLambdaExecutionRole
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
      Policies:
        - PolicyName: DynamoDBAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - dynamodb:GetItem
                  - dynamodb:PutItem
                  - dynamodb:UpdateItem
                  - dynamodb:Query
                  - dynamodb:Scan
                  - dynamodb:DeleteItem
                  - dynamodb:BatchGetItem
                Resource:
                  - !GetAtt UsersTable.Arn
                  - !GetAtt AuctionsTable.Arn
                  - !GetAtt BidsTable.Arn
                  - !GetAtt NotificationsTable.Arn
                  - !Sub '${BidsTable.Arn}/index/bidderId-placedAt-index'
        - PolicyName: S3Access
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                  - s3:DeleteObject
                Resource: !Sub 'arn:aws:s3:::${AuctionImagesS3Bucket}/*'
              - Effect: Allow
                Action: s3:ListBucket
                Resource: !Sub 'arn:aws:s3:::${AuctionImagesS3Bucket}'
        - PolicyName: StepFunctionsAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action: states:StartExecution
                Resource: !GetAtt WinnerMachineStateMachine.Arn

  # DynamoDB Tables
  UsersTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: Users
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: userId
          AttributeType: S
      KeySchema:
        - AttributeName: userId
          KeyType: HASH
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      Tags:
        - Key: Environment
          Value: !Ref Environment

  AuctionsTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: Auctions
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: auctionId
          AttributeType: S
      KeySchema:
        - AttributeName: auctionId
          KeyType: HASH
      TimeToLiveSpecification:
        AttributeName: expireAt
        Enabled: true
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      Tags:
        - Key: Environment
          Value: !Ref Environment

  BidsTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: Bids
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: auctionId
          AttributeType: S
        - AttributeName: placedAt
          AttributeType: S
        - AttributeName: bidderId
          AttributeType: S
      KeySchema:
        - AttributeName: auctionId
          KeyType: HASH
        - AttributeName: placedAt
          KeyType: RANGE
      GlobalSecondaryIndexes:
        - IndexName: bidderId-placedAt-index
          KeySchema:
            - AttributeName: bidderId
              KeyType: HASH
            - AttributeName: placedAt
              KeyType: RANGE
          Projection:
            ProjectionType: ALL
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      Tags:
        - Key: Environment
          Value: !Ref Environment

  NotificationsTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: Notifications
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: userId
          AttributeType: S
        - AttributeName: notificationId
          AttributeType: S
      KeySchema:
        - AttributeName: userId
          KeyType: HASH
        - AttributeName: notificationId
          KeyType: RANGE
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      Tags:
        - Key: Environment
          Value: !Ref Environment

  # S3 Bucket for Images
  AuctionImagesBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Ref AuctionImagesS3Bucket
      VersioningConfiguration:
        Status: Enabled
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Environment
          Value: !Ref Environment

  AuctionImagesBucketCorsConfiguration:
    Type: AWS::S3::BucketCors
    Properties:
      Bucket: !Ref AuctionImagesBucket
      CorsConfiguration:
        CorsRules:
          - AllowedOrigins:
              - 'https://yourdomain.com'
              - 'https://www.yourdomain.com'
            AllowedMethods:
              - GET
              - PUT
              - POST
              - DELETE
            AllowedHeaders:
              - '*'
            ExposeHeaders:
              - ETag
              - x-amz-version-id
            MaxAgeSeconds: 3000

  # Step Functions Role
  StepFunctionsExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: BiditStepFunctionsExecutionRole
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: states.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: LambdaInvoke
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action: lambda:InvokeFunction
                Resource: !Sub 'arn:aws:lambda:${AWS::Region}:${AWS::AccountId}:function:CheckAuctionStatus'
              - Effect: Allow
                Action: lambda:InvokeFunction
                Resource: !Sub 'arn:aws:lambda:${AWS::Region}:${AWS::AccountId}:function:ProcessAuctionWinner'

  # CloudWatch Log Group for Lambda
  LambdaLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: /aws/lambda/bidit
      RetentionInDays: 30

  # CloudWatch Alarms
  LambdaErrorAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: BiditLambdaErrors
      AlarmDescription: Alert when Lambda functions have errors
      MetricName: Errors
      Namespace: AWS/Lambda
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 5
      ComparisonOperator: GreaterThanThreshold
      AlarmActions:
        - !Sub 'arn:aws:sns:${AWS::Region}:${AWS::AccountId}:bidit-alerts'

  DynamoDBThrottlingAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: BiditDynamoDBThrottling
      AlarmDescription: Alert on DynamoDB throttling
      MetricName: UserErrors
      Namespace: AWS/DynamoDB
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      AlarmActions:
        - !Sub 'arn:aws:sns:${AWS::Region}:${AWS::AccountId}:bidit-alerts'

Outputs:
  UsersTableName:
    Value: !Ref UsersTable
    Export:
      Name: BiditUsersTable
  AuctionsTableName:
    Value: !Ref AuctionsTable
    Export:
      Name: BiditAuctionsTable
  BidsTableName:
    Value: !Ref BidsTable
    Export:
      Name: BiditBidsTable
  NotificationsTableName:
    Value: !Ref NotificationsTable
    Export:
      Name: BiditNotificationsTable
  S3BucketName:
    Value: !Ref AuctionImagesBucket
    Export:
      Name: BiditS3Bucket
  LambdaRoleArn:
    Value: !GetAtt BiditLambdaExecutionRole.Arn
    Export:
      Name: BiditLambdaRoleArn
```

Deploy the stack:

```bash
# Validate template
aws cloudformation validate-template --template-body file://bidit-stack.yaml

# Create stack
aws cloudformation create-stack \
  --stack-name bidit-prod \
  --template-body file://bidit-stack.yaml \
  --parameters ParameterKey=Environment,ParameterValue=prod \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1

# Monitor stack creation
aws cloudformation describe-stacks --stack-name bidit-prod --region us-east-1

# Update stack (for changes)
aws cloudformation update-stack \
  --stack-name bidit-prod \
  --template-body file://bidit-stack.yaml \
  --parameters ParameterKey=Environment,ParameterValue=prod \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

---

## Secrets Management

Never store secrets in code. Use AWS Secrets Manager:

```bash
# Store Agora certificate
aws secretsmanager create-secret \
  --name bidit/agora/cert \
  --secret-string '{"cert": "your-agora-app-certificate"}'

# Store database credentials if needed
aws secretsmanager create-secret \
  --name bidit/database/credentials \
  --secret-string '{"username": "admin", "password": "secure-password"}'

# Retrieve in Lambda
import json
import boto3

secretsmanager = boto3.client('secretsmanager')

def get_secret(secret_name):
    response = secretsmanager.get_secret_value(SecretId=secret_name)
    if 'SecretString' in response:
        return json.loads(response['SecretString'])
    return response['SecretBinary']

agora_cert = get_secret('bidit/agora/cert')['cert']
```

---

## Lambda Deployment

### Package Lambda Functions

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

# Package and deploy each Lambda
for func in "${LAMBDA_FUNCTIONS[@]}"; do
  echo "Deploying $func..."
  
  # Create deployment package
  cd "lambdas"
  zip -q -r "../${func}.zip" "${func}.py" -x "*.git*"
  cd ..
  
  # Check if function exists
  if aws lambda get-function --function-name "$func" --region "$REGION" 2>/dev/null; then
    # Update existing function
    aws lambda update-function-code \
      --function-name "$func" \
      --zip-file "fileb://${func}.zip" \
      --region "$REGION"
  else
    # Create new function
    aws lambda create-function \
      --function-name "$func" \
      --runtime python3.11 \
      --role "arn:aws:iam::${ACCOUNT_ID}:role/BiditLambdaExecutionRole" \
      --handler "${func}.lambda_handler" \
      --zip-file "fileb://${func}.zip" \
      --timeout 60 \
      --memory-size 256 \
      --environment Variables="{USERS_TABLE_NAME=Users,AUCTIONS_TABLE_NAME=Auctions,BIDS_TABLE_NAME=Bids,NOTIFICATIONS_TABLE_NAME=Notifications}" \
      --region "$REGION"
  fi
  
  # Clean up
  rm "${func}.zip"
done

echo "All Lambda functions deployed!"
```

Run the deployment:

```bash
chmod +x deploy-lambdas.sh
./deploy-lambdas.sh
```

---

## API Gateway Configuration

### Create REST API with Authorizer

```bash
# Create REST API
API_ID=$(aws apigateway create-rest-api \
  --name BiditAPI \
  --description "BidIt Live Auction Marketplace API" \
  --endpoint-configuration types=REGIONAL \
  --query 'id' \
  --output text)

echo "API ID: $API_ID"

# Create API key (optional, for rate limiting)
API_KEY=$(aws apigateway create-api-key \
  --name bidit-api-key \
  --enabled \
  --query 'id' \
  --output text)

# Create usage plan
USAGE_PLAN=$(aws apigateway create-usage-plan \
  --name bidit-usage-plan \
  --description "Usage plan for BidIt API" \
  --api-stages apiId=$API_ID,stage=prod \
  --query 'id' \
  --output text)

# Associate API key with usage plan
aws apigateway create-usage-plan-key \
  --usage-plan-id $USAGE_PLAN \
  --key-id $API_KEY \
  --key-type API_KEY
```

---

## Frontend Build and Deployment

### Build Frontend

```bash
cd frontend
npm run build
```

Output goes to `frontend/dist/`.

### Deploy to AWS S3 + CloudFront

```bash
#!/bin/bash
# deploy-frontend.sh

S3_BUCKET="bidit-frontend-prod"
DISTRIBUTION_ID="E1234567890ABC"

# Build
cd frontend
npm run build
cd ..

# Sync to S3
aws s3 sync frontend/dist/ "s3://${S3_BUCKET}/" \
  --delete \
  --cache-control "max-age=31536000" \
  --exclude "index.html"

# Set cache headers for index.html
aws s3 cp frontend/dist/index.html "s3://${S3_BUCKET}/index.html" \
  --cache-control "max-age=0, must-revalidate" \
  --content-type "text/html"

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id $DISTRIBUTION_ID \
  --paths "/*"

echo "Frontend deployed!"
```

---

## Database Migration

### Backup Before Deployment

```bash
# Create DynamoDB backup
aws dynamodb create-backup \
  --table-name Auctions \
  --backup-name bidit-auctions-backup-$(date +%Y%m%d-%H%M%S)

# List backups
aws dynamodb list-backups

# Restore from backup if needed
aws dynamodb restore-table-from-backup \
  --target-table-name AuctionsRestored \
  --backup-arn arn:aws:dynamodb:us-east-1:ACCOUNT_ID:table/Auctions/backup/01000000000000000
```

---

## Monitoring and Logging

### CloudWatch Dashboard

```bash
# Enable API Gateway logging
aws apigateway update-stage \
  --rest-api-id $API_ID \
  --stage-name prod \
  --patch-operations \
    op=replace,path=/*/loggingLevel,value=INFO \
    op=replace,path=/*/dataTraceEnabled,value=true
```

### CloudWatch Alarms

```bash
# Lambda errors
aws cloudwatch put-metric-alarm \
  --alarm-name bidit-lambda-errors \
  --alarm-description "Alert on Lambda function errors" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold \
  --alarm-actions arn:aws:sns:us-east-1:ACCOUNT_ID:bidit-alerts

# DynamoDB throttling
aws cloudwatch put-metric-alarm \
  --alarm-name bidit-dynamodb-throttle \
  --alarm-description "Alert on DynamoDB throttling" \
  --metric-name UserErrors \
  --namespace AWS/DynamoDB \
  --statistic Sum \
  --period 300 \
  --threshold 1 \
  --comparison-operator GreaterThanOrEqualToThreshold \
  --alarm-actions arn:aws:sns:us-east-1:ACCOUNT_ID:bidit-alerts
```

### Log Retention

```bash
# Set log retention to 30 days
aws logs put-retention-policy \
  --log-group-name /aws/lambda/bidit \
  --retention-in-days 30
```

---

## Security Hardening

### 1. S3 Bucket Security

```bash
# Enable bucket encryption
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

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket bidit-auction-images-2026 \
  --versioning-configuration Status=Enabled
```

### 2. CORS Configuration (Production)

Restrict CORS to production domain:

```bash
aws s3api put-bucket-cors \
  --bucket bidit-auction-images-2026 \
  --cors-configuration '{
    "CORSRules": [{
      "AllowedOrigins": ["https://yourdomain.com", "https://www.yourdomain.com"],
      "AllowedMethods": ["GET", "PUT"],
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3000
    }]
  }'
```

---

## Rollback Procedures

### Lambda Rollback

```bash
# List function versions
aws lambda list-versions-by-function --function-name createAuction

# Rollback to previous version
aws lambda update-alias \
  --function-name createAuction \
  --name prod \
  --function-version 5  # Previous stable version
```

### DynamoDB Rollback

```bash
# Restore from backup
aws dynamodb restore-table-from-backup \
  --target-table-name AuctionsRollback \
  --backup-arn arn:aws:dynamodb:us-east-1:ACCOUNT_ID:table/Auctions/backup/01000000000000000
```

### Frontend Rollback

```bash
# Invalidate current CloudFront distribution
aws cloudfront create-invalidation \
  --distribution-id $DISTRIBUTION_ID \
  --paths "/*"

# Restore previous version from S3
aws s3 cp s3://bidit-frontend-prod-backup/index.html s3://bidit-frontend-prod/index.html
```

---

## Post-Deployment Verification

### Smoke Tests

```bash
#!/bin/bash
# smoke-tests.sh

API_URL="https://api.yourdomain.com/dev"

# Test 1: Get auctions
echo "Testing auction list..."
curl -X GET "$API_URL/auctions"

# Test 2: Agora token
echo "Testing Agora token generation..."
curl -X GET "$API_URL/agora/token?channelName=test&uid=123&isPublisher=true"

# Test 3: S3 upload URL
echo "Testing S3 presigned URL..."
curl -X POST "$API_URL/upload-url" \
  -H "Content-Type: application/json" \
  -d '{"action": "get", "imageKey": "test-image.webp"}'

echo "Smoke tests complete!"
```

---

## Reference Links

- [AWS Lambda Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)
- [DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)
- [API Gateway Security](https://docs.aws.amazon.com/apigateway/latest/developerguide/security.html)
- [CloudFormation User Guide](https://docs.aws.amazon.com/cloudformation/latest/userguide/)
- [AWS Secrets Manager](https://docs.aws.amazon.com/secretsmanager/)
