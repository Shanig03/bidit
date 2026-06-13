# BidIt Technical Installation Guide

This guide deploys BidIt backend infrastructure with CloudFormation for section 9 submission review. It covers DynamoDB, S3 image storage, Lambda functions, API Gateway, and the `WinnerMachine` Step Functions workflow.

## Prerequisites

- AWS CLI v2 configured with credentials for the target account.
- Python 3.11+ and `pip` for Lambda packaging. Run packaging from a machine with internet/PyPI access because `generateAgoraToken` needs the Python dependency listed in `backend/requirements.txt`; AWS Academy/VocLabs networks may block PyPI.
- `zip` on Linux/macOS or PowerShell `Compress-Archive` on Windows.
- An existing S3 deployment/artifact bucket for Lambda zip uploads.
- A globally unique S3 bucket name for BidIt auction/profile images.
- Optional Agora App ID and App Certificate for live video token generation.

## AWS Academy / VocLabs notes

AWS Academy often supplies a pre-created `LabRole` and may block creating IAM roles or adding Lambda permissions. The template supports both modes:

- Regular AWS account: CloudFormation creates Lambda and Step Functions roles.
- AWS Academy: pass `UseExistingLabRole=true` and the `ExistingLabRoleArn` for `LabRole`.

If `lambda:AddPermission` is blocked, API Gateway invoke permissions may need to be added manually in the Lambda console or by an instructor-provided role with sufficient permissions.

## Connect to AWS
```
  aws configure
```
region: us-east-1
format: json

## Package Lambdas

Linux/macOS:

```bash
scripts/linux/package-lambdas.sh
```

Windows PowerShell:

```powershell
scripts\win\package-lambdas.ps1
```

The scripts write zip files to `.deploy/lambda-zips/`. This directory is ignored by Git.

## Deploy in a regular AWS account

Linux/macOS example:

```bash
export AWS_REGION=us-east-1
export ARTIFACT_BUCKET=my-existing-deployment-bucket
export IMAGES_BUCKET=bidit-images-myname-2026
export STACK_NAME=bidit-dev
export STAGE=dev
export AGORA_APP_ID=your-agora-app-id
export AGORA_APP_CERT=your-agora-app-certificate
scripts/linux/deploy-infrastructure.sh
```

Windows PowerShell example:

```powershell
scripts\win\deploy-infrastructure.ps1 `
  -Region us-east-1 `
  -StackName bidit-dev `
  -Stage dev `
  -ArtifactBucket my-existing-deployment-bucket `
  -ImagesBucket bidit-images-myname-2026 `
  -AgoraAppId your-agora-app-id `
  -AgoraAppCertificate your-agora-app-certificate
```

## Deploy in AWS Academy using LabRole

Find the LabRole ARN in IAM or CloudFormation lab outputs, then deploy with existing-role mode. In many AWS Academy labs the ARN has the form `arn:aws:iam::<account-id>:role/LabRole`; copy the exact ARN from the lab account and provide it as `EXISTING_LAB_ROLE_ARN` on Linux/macOS or `-ExistingLabRoleArn` in PowerShell.

Linux/macOS:

```bash
export AWS_REGION=us-east-1
export ARTIFACT_BUCKET=my-existing-deployment-bucket
export IMAGES_BUCKET=bidit-images-myname-2026
export USE_EXISTING_LAB_ROLE=true
export EXISTING_LAB_ROLE_ARN=arn:aws:iam::123456789012:role/LabRole
scripts/linux/deploy-infrastructure.sh
```

Windows PowerShell:

```powershell
scripts\win\deploy-infrastructure.ps1 `
  -ArtifactBucket my-existing-deployment-bucket `
  -ImagesBucket bidit-images-myname-2026 `
  -UseExistingLabRole true `
  -ExistingLabRoleArn arn:aws:iam::123456789012:role/LabRole
```

## Get API URL and configure frontend

After deployment, the scripts print stack outputs. Copy `ApiInvokeUrl` into `.env` or `frontend/.env`:

```env
VITE_API_BASE_URL=https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/dev
VITE_AGORA_APP_ID=YOUR_AGORA_APP_ID
```

Run the frontend locally:

```bash
cd frontend
npm install
npm run dev
```

Optional production frontend deployment: run `npm run build`, then upload `frontend/dist` to an S3 static website bucket, AWS Amplify, or S3 plus CloudFront. This repository's CloudFormation stack does not deploy the frontend.

## Verify deployment

- DynamoDB: confirm `Auctions`, `Bids`, `Notifications`, and `Users` tables exist.
- S3: confirm the image bucket exists and blocks public access.
- Lambda: confirm all functions are present and use the expected handlers.
- API Gateway: open the `ApiInvokeUrl` output and test routes such as `GET /auctions`.
- Step Functions: confirm `WinnerMachine` exists and references deployed `CheckAuctionStatus` and `ProcessAuctionWinner` Lambda ARNs.

## Troubleshooting

- **AccessDenied in AWS Academy**: redeploy with `UseExistingLabRole=true` and `ExistingLabRoleArn` set to `LabRole`. Some permissions may still be lab-restricted.
- **Missing LabRole**: check the IAM console or AWS Academy lab instructions. Some labs expose the ARN in CloudFormation outputs.
- **S3 bucket name already taken**: choose a different globally unique `ImagesBucketName`.
- **CloudFormation rollback**: inspect stack events with `aws cloudformation describe-stack-events --stack-name bidit-dev`.
- **Lambda zip not found**: run the package script, then ensure deploy script uploaded `.deploy/lambda-zips/*.zip` to the artifact bucket/prefix.
- **PyPI access blocked during packaging**: package Lambdas from a machine with internet access, or pre-vendor the needed Python dependency in an approved environment before uploading artifacts. AWS Academy/VocLabs may block direct PyPI downloads.
- **API Gateway CORS errors**: verify the browser is using the latest `ApiInvokeUrl`, redeploy the stack, and confirm the route has an `OPTIONS` method.
- **Step Functions role errors**: in AWS Academy use `LabRole`; in regular accounts deploy with `CAPABILITY_NAMED_IAM`.
- **DynamoDB table already exists**: delete or rename existing tables before deploying because the template intentionally uses the required fixed table names.
