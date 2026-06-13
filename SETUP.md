# BidIt - Local Development Setup Guide

This guide walks you through setting up BidIt for local development. You'll configure the frontend, backend Lambda environment, Firebase, AWS services, and Agora.

## Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Python** >= 3.11
- **Git**
- **AWS Account** with appropriate IAM permissions
- **Firebase Account** with a project
- **Agora Account** with an active project
- **Docker** (optional, for containerized Lambda testing)

## Part 1: Clone and Initial Setup

```bash
# Clone the repository
git clone https://github.com/Shanig03/bidit.git
cd bidit

# Check Node.js and npm versions
node --version
npm --version

# Check Python version
python3 --version
```

## Part 2: Frontend Setup

### 2.1 Install Frontend Dependencies

```bash
cd frontend
npm install
```

### 2.2 Configure Frontend Environment Variables

Create a `frontend/.env` file in the frontend directory:

```env
# API Gateway base URL (update with your deployed API Gateway URL)
VITE_API_BASE_URL=http://localhost:3001

# Agora App ID (from your Agora project)
VITE_AGORA_APP_ID=your-agora-app-id-here
```

For production, use the actual API Gateway endpoint:
```env
VITE_API_BASE_URL=https://<api-id>.execute-api.us-east-1.amazonaws.com/dev
VITE_AGORA_APP_ID=your-agora-app-id-here
```

### 2.3 Verify Firebase Configuration

The Firebase config is already embedded in `frontend/src/firebase/firebaseConfig.js` for the `bidit-963a8` project. If you're setting up a **different Firebase project**, update the config values:

```javascript
// frontend/src/firebase/firebaseConfig.js
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  databaseURL: "YOUR_DATABASE_URL",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### 2.4 Run Frontend Locally

```bash
# From frontend directory
npm run dev
```

The frontend will start at `http://localhost:5173` by default. You'll see Vite's dev server output with the local URL.

### 2.5 Lint Frontend (Optional)

```bash
npm run lint
```

---

## Part 3: Backend (Lambda) Setup

### 3.1 Install Python Dependencies

```bash
cd lambdas
pip install -r requirements.txt
```

### 3.2 Configure Lambda Environment Variables

Lambda functions read environment variables from AWS Lambda console or deployment configuration. Create a `.env.lambda` file locally for reference (do **not** commit secrets):

```env
# DynamoDB Table Names
USERS_TABLE_NAME=Users
AUCTIONS_TABLE_NAME=Auctions
BIDS_TABLE_NAME=Bids
NOTIFICATIONS_TABLE_NAME=Notifications

# Agora Credentials (KEEP SECRET - store in AWS Secrets Manager)
AGORA_APP_ID=your-agora-app-id
AGORA_APP_CERT=your-agora-app-certificate-secret

# S3 Configuration
BUCKET_NAME=bidit-auction-images-2026

# Step Functions
STATE_MACHINE_ARN=arn:aws:states:us-east-1:YOUR_ACCOUNT_ID:stateMachine:WinnerMachine
```

### 3.3 Test Lambda Functions Locally (Optional)

Use AWS SAM or LocalStack to test Lambda functions:

**Using AWS SAM:**

```bash
# Install AWS SAM CLI
brew install aws-sam-cli  # macOS
# or follow: https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html

# Build Lambda
sam build

# Run a Lambda locally
sam local start-api
```

**Using LocalStack (Docker required):**

```bash
# Start LocalStack
docker run -d -p 4566:4566 localstack/localstack

# Set AWS credentials for LocalStack
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_DEFAULT_REGION=us-east-1

# Create DynamoDB tables in LocalStack
aws dynamodb create-table \
  --table-name Users \
  --attribute-definitions AttributeName=userId,AttributeType=S \
  --key-schema AttributeName=userId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --endpoint-url http://localhost:4566
```

---

## Part 4: Firebase Setup

### 4.1 Create/Verify Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project or select an existing one (currently using `bidit-963a8`)
3. Enable **Authentication** and **Realtime Database**

### 4.2 Configure Firebase Authentication

1. In Firebase Console, go to **Authentication** > **Sign-in method**
2. Enable:
   - **Email/Password**
   - **Google** (add OAuth redirect URIs for `localhost:5173` and your production domain)

### 4.3 Configure Firebase Realtime Database

1. Go to **Realtime Database** > **Create Database**
2. Start in **test mode** for development (open read/write, not production-safe)
3. Use this structure for security rules in production:

```json
{
  "rules": {
    "auctionChats": {
      "$auctionId": {
        "messages": {
          ".read": "auth != null",
          ".write": "auth != null"
        }
      }
    },
    "auctions": {
      "$auctionId": {
        "viewers": {
          ".read": true,
          ".write": "auth != null"
        }
      }
    },
    "userStatuses": {
      "$userId": {
        ".read": "$userId === auth.uid || root.child('users').child(auth.uid).child('role').val() === 'ADMIN'",
        ".write": "root.child('users').child(auth.uid).child('role').val() === 'ADMIN'"
      }
    }
  }
}
```

### 4.4 Get Firebase Configuration

From Firebase Console:
1. Go to **Project Settings** > **Your apps** > **Web**
2. Copy the config object
3. Update `frontend/src/firebase/firebaseConfig.js` if using a different project

---

## Part 5: AWS Services Setup

### 5.1 Prerequisites

- AWS CLI installed and configured: `aws configure`
- Appropriate IAM permissions for Lambda, DynamoDB, S3, API Gateway, Step Functions, and CloudWatch

### 5.2 Create DynamoDB Tables

```bash
# Users Table
aws dynamodb create-table \
  --table-name Users \
  --attribute-definitions AttributeName=userId,AttributeType=S \
  --key-schema AttributeName=userId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1

# Auctions Table
aws dynamodb create-table \
  --table-name Auctions \
  --attribute-definitions AttributeName=auctionId,AttributeType=S \
  --key-schema AttributeName=auctionId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1

# Bids Table with GSI
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
  --region us-east-1

# Notifications Table
aws dynamodb create-table \
  --table-name Notifications \
  --attribute-definitions \
    AttributeName=userId,AttributeType=S \
    AttributeName=notificationId,AttributeType=S \
  --key-schema \
    AttributeName=userId,KeyType=HASH \
    AttributeName=notificationId,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1

# Verify tables
aws dynamodb list-tables --region us-east-1
```

### 5.3 Create S3 Bucket

```bash
# Create bucket
aws s3 mb s3://bidit-auction-images-2026 --region us-east-1

# Enable versioning (optional, for recovery)
aws s3api put-bucket-versioning \
  --bucket bidit-auction-images-2026 \
  --versioning-configuration Status=Enabled

# Set bucket policy to allow Lambda and frontend access (see Section 5.7 below)

# Enable CORS (required for frontend S3 uploads)
aws s3api put-bucket-cors \
  --bucket bidit-auction-images-2026 \
  --cors-configuration file://s3-cors-config.json
```

Create `s3-cors-config.json`:
```json
{
  "CORSRules": [
    {
      "AllowedOrigins": ["http://localhost:5173", "https://yourdomain.com"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["ETag", "x-amz-version-id"],
      "MaxAgeSeconds": 3000
    }
  ]
}
```

### 5.4 Deploy Lambda Functions

```bash
# Install AWS SAM (if not already done)
brew install aws-sam-cli

# Navigate to lambdas directory
cd lambdas

# Package all Lambda functions
# Create a deployment package for each Lambda file
zip -r createUser.zip createUser.py
zip -r createAuction.zip createAuction.py
# ... repeat for all Lambda files

# Create IAM role for Lambda (if not exists)
aws iam create-role \
  --role-name BiditLambdaExecutionRole \
  --assume-role-policy-document file://lambda-trust-policy.json

# Attach policies
aws iam attach-role-policy \
  --role-name BiditLambdaExecutionRole \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

# Deploy Lambda (example for createAuction)
aws lambda create-function \
  --function-name createAuction \
  --runtime python3.11 \
  --role arn:aws:iam::YOUR_ACCOUNT_ID:role/BiditLambdaExecutionRole \
  --handler createAuction.lambda_handler \
  --zip-file fileb://createAuction.zip \
  --timeout 60 \
  --memory-size 256 \
  --environment Variables={USERS_TABLE_NAME=Users,AUCTIONS_TABLE_NAME=Auctions,STATE_MACHINE_ARN=arn:aws:states:us-east-1:YOUR_ACCOUNT_ID:stateMachine:WinnerMachine} \
  --region us-east-1

# Update function code (for subsequent deploys)
aws lambda update-function-code \
  --function-name createAuction \
  --zip-file fileb://createAuction.zip
```

Create `lambda-trust-policy.json`:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

### 5.5 Create API Gateway

Use the verified Swagger export (`BiditAPI`) or create a REST API:

```bash
# Create REST API
aws apigateway create-rest-api \
  --name BiditAPI \
  --description "BidIt Live Auction Marketplace API"

# Get API ID
API_ID=$(aws apigateway get-rest-apis --query "items[?name=='BiditAPI'].id" --output text)

# Create resources and methods pointing to Lambda functions
# (Detailed steps for each endpoint available in DEPLOYMENT.md)
```

### 5.6 Create Step Functions State Machine

```bash
# Deploy the WinnerMachine state machine
aws stepfunctions create-state-machine \
  --name WinnerMachine \
  --definition file://backend/step-functions/WinnerMachine.asl.json \
  --role-arn arn:aws:iam::YOUR_ACCOUNT_ID:role/BiditStepFunctionsExecutionRole

# Update Lambda ARNs in WinnerMachine.asl.json to match your AWS account
```

### 5.7 IAM Policy for Lambda to Access AWS Services

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:Query",
        "dynamodb:Scan",
        "dynamodb:DeleteItem",
        "dynamodb:BatchGetItem"
      ],
      "Resource": [
        "arn:aws:dynamodb:us-east-1:YOUR_ACCOUNT_ID:table/Users",
        "arn:aws:dynamodb:us-east-1:YOUR_ACCOUNT_ID:table/Auctions",
        "arn:aws:dynamodb:us-east-1:YOUR_ACCOUNT_ID:table/Bids",
        "arn:aws:dynamodb:us-east-1:YOUR_ACCOUNT_ID:table/Notifications",
        "arn:aws:dynamodb:us-east-1:YOUR_ACCOUNT_ID:table/Bids/index/bidderId-placedAt-index"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::bidit-auction-images-2026/*"
    },
    {
      "Effect": "Allow",
      "Action": "s3:ListBucket",
      "Resource": "arn:aws:s3:::bidit-auction-images-2026"
    },
    {
      "Effect": "Allow",
      "Action": [
        "states:StartExecution"
      ],
      "Resource": "arn:aws:states:us-east-1:YOUR_ACCOUNT_ID:stateMachine:WinnerMachine"
    }
  ]
}
```

---

## Part 6: Agora Setup

### 6.1 Create Agora Project

1. Go to [Agora Console](https://console.agora.io)
2. Sign up or log in
3. Create a new project
4. Note your **App ID** and **App Certificate**

### 6.2 Configure Agora

1. Update Lambda environment variable `AGORA_APP_ID` and `AGORA_APP_CERT`
2. Update frontend `.env` with `VITE_AGORA_APP_ID`

**Important:** Never commit `AGORA_APP_CERT` to source control. Store it in AWS Secrets Manager or Lambda environment variables only.

```bash
# Store in AWS Secrets Manager (recommended)
aws secretsmanager create-secret \
  --name bidit/agora/cert \
  --secret-string "your-agora-app-certificate"

# Retrieve in Lambda
import json
import boto3

secretsmanager = boto3.client('secretsmanager')
secret = secretsmanager.get_secret_value(SecretId='bidit/agora/cert')
agora_cert = json.loads(secret['SecretString'])['cert']
```

---

## Part 7: Verification and Testing

### 7.1 Verify Frontend

```bash
cd frontend
npm run dev
```

Visit `http://localhost:5173` and verify:
- [ ] Homepage loads
- [ ] Sign up/login forms render
- [ ] Firebase authentication flows work (email/password, Google)

### 7.2 Verify Backend

```bash
# Test DynamoDB connectivity
aws dynamodb scan --table-name Users --limit 5 --region us-east-1

# Test S3 bucket
aws s3 ls s3://bidit-auction-images-2026 --region us-east-1

# Test Lambda (after deployment)
aws lambda invoke \
  --function-name createUser \
  --payload '{"body": "{\"uid\": \"test-uid\", \"email\": \"test@example.com\"}"}' \
  response.json

cat response.json
```

### 7.3 Verify Firebase

In Firebase Console:
- [ ] Authentication > Sign-in method shows Email/Password and Google enabled
- [ ] Realtime Database is created and accessible
- [ ] Test chat writes to `auctionChats/{auctionId}/messages`

### 7.4 Verify Agora

```bash
# Test token generation
curl -X GET "http://YOUR_API_GATEWAY_URL/dev/agora/token?channelName=test-channel&uid=123&isPublisher=true"
```

Expected response:
```json
{
  "token": "...",
  "appId": "your-agora-app-id",
  "channelName": "test-channel",
  "uid": 123,
  "expiresIn": 7200
}
```

---

## Part 8: Common Issues and Troubleshooting

### Frontend won't start

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Lambda deployment fails

```bash
# Check IAM role permissions
aws iam get-role --role-name BiditLambdaExecutionRole

# Check Lambda function logs
aws logs tail /aws/lambda/createAuction --follow
```

### DynamoDB tables not accessible

```bash
# Verify table exists
aws dynamodb describe-table --table-name Users

# Check IAM permissions in Lambda role
aws iam get-role-policy --role-name BiditLambdaExecutionRole --policy-name DynamoDBAccess
```

### S3 CORS errors during image upload

```bash
# Check bucket CORS configuration
aws s3api get-bucket-cors --bucket bidit-auction-images-2026

# Update if needed
aws s3api put-bucket-cors \
  --bucket bidit-auction-images-2026 \
  --cors-configuration file://s3-cors-config.json
```

### Firebase connection issues

- Verify `firebaseConfig.js` has correct credentials
- Check Firebase Realtime Database rules allow your domain
- Ensure authentication is enabled in Firebase Console

---

## Part 9: Next Steps

Once local development is working:

1. **Run end-to-end tests** — Create and bid on a test auction
2. **Check CloudWatch logs** — Monitor Lambda execution and errors
3. **Test the auction workflow** — Verify Step Functions processes winners correctly
4. **Review security settings** — Before production, follow recommendations in DEPLOYMENT.md

---

## Part 10: Development Workflow

### Daily Development

```bash
# Terminal 1: Frontend
cd frontend
npm run dev

# Terminal 2: Monitor Lambda logs (during testing)
aws logs tail /aws/lambda/createAuction --follow

# Terminal 3: Monitor DynamoDB queries
# Use AWS Console or CloudWatch
```

### Before Committing

```bash
# Lint frontend code
cd frontend
npm run lint

# Never commit:
# - .env files with real secrets
# - AWS credentials
# - Firebase credentials (though web config is public)
# - Agora App Certificate
```

---

## Reference

- [Vite Documentation](https://vitejs.dev)
- [React Documentation](https://react.dev)
- [Firebase Documentation](https://firebase.google.com/docs)
- [AWS Lambda Documentation](https://docs.aws.amazon.com/lambda)
- [DynamoDB Developer Guide](https://docs.aws.amazon.com/dynamodb)
- [Agora Documentation](https://docs.agora.io)
