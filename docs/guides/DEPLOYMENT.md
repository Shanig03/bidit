# BidIt System Deployment Guide

This document provides the exhaustive steps to deploy the BidIt application to AWS.

---

## Step 1: Pre-Deployment Preparation

Ensure the following files exist in the **project root**:

### 1. Swagger File

* `swagger_api_gateway.json`
* Must start with:

```json
{
  "swagger": "2.0"
}
```

---

### 2. S3 CORS Configuration

Create `s3-cors-config.json`:

```json id="cors1"
{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
      "AllowedOrigins": ["*"],
      "ExposeHeaders": ["ETag"]
    }
  ]
}
```

---

### 3. IAM Role Verification

In AWS Console:

* Go to **IAM → Roles**
* Find your Lambda execution role (e.g. `BiditLambdaExecutionRole`)
* Ensure it exists and has Lambda + DynamoDB + S3 permissions

---

## Step 2: Backend Deployment (Windows)

Open **PowerShell in the project root**:

```powershell id="deploy1"
.\scripts\win\deploy-lambdas.ps1
```

### What this does:

* Injects AWS Account ID into Swagger
* Creates API Gateway (or updates it)
* Deploys/updates all Lambda functions
* Outputs your API Gateway ID

### Output example:

```text id="out1"
API_ID=abc123xyz
VITE_API_BASE_URL=https://abc123xyz.execute-api.us-east-1.amazonaws.com/dev
```

Save this URL.

---

## Step 3: Frontend Deployment

### 1. Update environment file

Edit:

```text id="env1"
frontend/.env
```

Add:

```env id="env2"
VITE_API_BASE_URL=https://<YOUR_API_ID>.execute-api.us-east-1.amazonaws.com/dev
VITE_AGORA_APP_ID=your-agora-app-id
```

---

### 2. Run frontend build

```powershell id="build1"
.\scripts\win\deploy-frontend.ps1
```

This generates:

```text id="dist1"
frontend/dist
```

---

### 3. Deploy to AWS Amplify

1. Open AWS Amplify Console
2. Select **Deploy without Git provider**
3. Name app: `BidIt-Frontend`
4. Upload `frontend/dist`
5. Click **Save and Deploy**

---

## Step 4: Final Configuration (AWS Console)

### Agora Setup

Go to Lambda:

* `generateAgoraToken`
* Add environment variables:

```env id="agora1"
AGORA_APP_ID=your-agora-app-id
AGORA_APP_CERT=your-agora-app-certificate
```

---

## Step 5: Smoke Testing

Run backend verification:

```powershell id="test1"
.\scripts\win\smoke-tests.ps1 -API_URL "https://<YOUR_API_ID>.execute-api.us-east-1.amazonaws.com/dev"
```

---

## Step 6: Success Criteria

Deployment is successful if:

* All Lambda functions return HTTP 200
* API Gateway is reachable
* DynamoDB tables are accessible
* Frontend loads via Amplify URL
* Image uploads work via S3
* Authentication works via Firebase

---

## Troubleshooting

### AWS CLI errors

```powershell
aws --version
```

If not found, reinstall AWS CLI and restart terminal.

---

### Lambda deployment fails

* Check IAM role permissions
* Check CloudWatch logs

---

### Frontend not loading

* Verify `VITE_API_BASE_URL`
* Rebuild frontend

---

## Related Docs

* `docs/guides/SETUP.md`
* `docs/ARCHITECTURE.md`
