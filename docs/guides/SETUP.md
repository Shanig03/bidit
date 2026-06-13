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

The frontend will start at `http://localhost:5173` by default.

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

Use AWS SAM or LocalStack to test Lambda functions.

---

## Part 4: Firebase Setup

### 4.1 Create/Verify Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project or select an existing one
3. Enable **Authentication** and **Realtime Database**

### 4.2 Configure Firebase Authentication

1. In Firebase Console, go to **Authentication** > **Sign-in method**
2. Enable:
   - **Email/Password**
   - **Google** (add OAuth redirect URIs for `localhost:5173` and your production domain)

### 4.3 Configure Firebase Realtime Database

1. Go to **Realtime Database** > **Create Database**
2. Start in **test mode** for development
3. Production security rules available in DEPLOYMENT.md

---

## Part 5: AWS Services Setup

### 5.1 Create DynamoDB Tables

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
```

### 5.2 Create S3 Bucket

```bash
aws s3 mb s3://bidit-auction-images-2026 --region us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket bidit-auction-images-2026 \
  --versioning-configuration Status=Enabled

# Enable CORS
aws s3api put-bucket-cors \
  --bucket bidit-auction-images-2026 \
  --cors-configuration file://s3-cors-config.json
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

---

## Part 7: Verification and Testing

### 7.1 Verify Frontend

```bash
cd frontend
npm run dev
```

Visit `http://localhost:5173` and verify everything loads.

### 7.2 Verify Backend

```bash
# Test DynamoDB
aws dynamodb scan --table-name Users --limit 5 --region us-east-1

# Test S3 bucket
aws s3 ls s3://bidit-auction-images-2026 --region us-east-1
```

---

## Part 8: Troubleshooting

### Frontend won't start

```bash
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### DynamoDB tables not accessible

```bash
aws dynamodb describe-table --table-name Users
aws iam get-role-policy --role-name BiditLambdaExecutionRole --policy-name DynamoDBAccess
```

### S3 CORS errors

```bash
aws s3api get-bucket-cors --bucket bidit-auction-images-2026
```

---

For more details, see [DEPLOYMENT.md](../guides/DEPLOYMENT.md).
