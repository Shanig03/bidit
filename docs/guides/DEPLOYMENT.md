# Section 09: BidIt System Installation Guide

This document provides step-by-step instructions for deploying the BidIt architecture into a clean AWS production environment.

All scripts and Infrastructure as Code (IaC) templates are designed to dynamically adapt to the hosting AWS Account ID and Region to ensure a zero-conflict deployment.

## Prerequisites

* AWS CLI installed and configured (`aws configure`) with Administrator access.
* Node.js (>= 18.0.0) & npm.
* Python 3.11.

---

## Zero-Click Automated Backend Deployment

Run these commands from the root directory of the extracted source code.

### Step 1: Deploy Core Infrastructure (CloudFormation)

This provisions the DynamoDB tables, dynamically names S3 buckets (using your Account ID), and creates the necessary IAM execution roles.

```bash
aws cloudformation create-stack \
  --stack-name bidit-prod-infrastructure \
  --template-body file://bidit-stack.yaml \
  --parameters ParameterKey=Environment,ParameterValue=prod \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1

# Wait for stack completion
aws cloudformation wait stack-create-complete \
  --stack-name bidit-prod-infrastructure
```

### Step 2: Deploy Backend Logic (Lambdas & API Gateway)

This script packages all Lambda functions, dynamically injects the AWS Account ID into the API configuration, and deploys the REST API.

```bash
./scripts/deploy-lambdas.sh
```

**Note:** The script will output an `API_ID`. Save this value for the frontend configuration.

### Step 3: Inject Required Secrets

The live-streaming features require Agora RTC credentials.

```bash
aws secretsmanager create-secret \
  --name bidit/agora/cert \
  --secret-string '{"cert":"your-agora-app-certificate"}'
```

---

## Frontend Deployment (AWS Amplify)

BidIt uses AWS Amplify for frontend hosting.

### Step 1: Configure Environment Variables

Update `frontend/.env`:

```env
VITE_API_BASE_URL=https://<YOUR_API_ID>.execute-api.us-east-1.amazonaws.com/dev
VITE_AGORA_APP_ID=your-agora-app-id
```

### Step 2: Build and Deploy

Build the React frontend:

```bash
./scripts/build-frontend.sh
```

Follow the generated instructions to upload the contents of `frontend/dist` to AWS Amplify.

---

## Verifying the Installation

Run the smoke tests:

```bash
./scripts/smoke-tests.sh \
https://<YOUR_API_ID>.execute-api.us-east-1.amazonaws.com/dev
```

If all tests return HTTP 200 responses, the deployment is operational.

---

## Notes

* S3 bucket names are generated dynamically using the AWS Account ID.
* Lambda deployments are fully automated through the deployment scripts.
* No manual DynamoDB table creation is required.
* The frontend is hosted separately through AWS Amplify.
* Agora credentials must be provided before video streaming functionality becomes available.
