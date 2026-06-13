# BidIt Technical Installation Guide

This guide deploys BidIt backend infrastructure with CloudFormation for section 9 submission review. It covers DynamoDB, S3 image storage, Lambda functions, API Gateway, and the `WinnerMachine` Step Functions workflow.

## Local Development Overview

In addition to the AWS backend deployment described below, BidIt also requires local frontend configuration and external service setup.

The project uses:

- React/Vite for the frontend.
- Firebase Authentication for user registration and login.
- Firebase Realtime Database for realtime frontend behavior such as viewer/presence-related updates.
- AWS API Gateway and Lambda for backend API requests.
- DynamoDB for users, auctions, bids, favorites, and notifications.
- S3 for auction/profile image storage through presigned URLs.
- Step Functions for the auction winner workflow.
- Agora for live auction video.

Firebase is not used as the main auction database. Auction data, bids, notifications, favorites, and user-related backend records are stored in DynamoDB. Firebase is used mainly for authentication and realtime frontend behavior.

## Additional Local Development Prerequisites

For local frontend development, make sure the following are also installed or available:

- Node.js 18.0.0 or newer.
- npm 9.0.0 or newer.
- Git.
- A Firebase account and Firebase project.
- An Agora account and Agora project.
- Optional Docker, only if you want to test Lambda functions in a containerized local environment.

Check the local versions:

```bash
node --version
npm --version
python --version
git --version
```

On some systems, Python may be available as:

```bash
python3 --version
```

## Clone and Initial Setup

Clone the repository and enter the project directory:

```bash
git clone https://github.com/Shanig03/bidit.git
cd bidit
```

## Frontend Setup

Install frontend dependencies:

```bash
cd frontend
npm install
```

Create a `frontend/.env` or `frontend/.env.local` file.

For local development with the deployed AWS backend, use the API Gateway URL printed by the CloudFormation deployment:

```env
VITE_API_BASE_URL=https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/dev
VITE_AGORA_APP_ID=your-agora-app-id-here
```

After deployment, the script prints an output named `ApiInvokeUrl`. Copy that value into `VITE_API_BASE_URL`.

Do not put the Agora App Certificate in the frontend environment file. The certificate is a secret and must stay only in the backend/Lambda configuration.

Run the frontend locally:

```bash
npm run dev
```

The frontend usually starts at:

```text
http://localhost:5173
```

## Firebase Setup

BidIt uses Firebase for authentication and realtime frontend behavior.

### Create or Verify Firebase Project

Go to the Firebase Console.

Create a new project or select the existing BidIt Firebase project.

Enable the following Firebase services:

- Authentication.
- Realtime Database.

### Configure Firebase Authentication

In Firebase Console, go to:

```text
Authentication > Sign-in method
```

Enable the sign-in providers used by the project, for example:

- Email/Password.
- Google.

For local development, make sure this domain is authorized:

```text
localhost
```

If the frontend is deployed later using AWS Amplify, CloudFront, S3 static website hosting, Vercel, Netlify, or a custom domain, add that production domain to Firebase Authentication authorized domains as well.

Examples:

```text
main.xxxxx.amplifyapp.com
your-cloudfront-domain.cloudfront.net
your-custom-domain.com
```

### Configure Firebase Realtime Database

In Firebase Console, go to:

```text
Realtime Database > Create Database
```

For development, test mode can be used temporarily. For production or final deployment, use restricted rules that allow only authenticated users to access the required realtime paths.

Firebase Realtime Database is used for realtime frontend behavior such as viewer/presence-related updates. It does not replace DynamoDB for auctions, bids, users, favorites, or notifications.

### Verify Firebase Frontend Configuration

The Firebase web configuration is located in:

```text
frontend/src/firebase/firebaseConfig.js
```

If using a different Firebase project, update the config values:

```javascript
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

The Firebase web config is client-side configuration and can exist in frontend code. Do not commit private Firebase admin credentials or service-account keys.

## Agora Setup

BidIt uses Agora for live video.

Create or open an Agora project and copy:

- Agora App ID.
- Agora App Certificate.

The frontend needs only the App ID:

```env
VITE_AGORA_APP_ID=your-agora-app-id-here
```

The backend token Lambda needs both:

```text
AGORA_APP_ID
AGORA_APP_CERT
```

When deploying with CloudFormation, these values are passed as:

```text
AgoraAppId
AgoraAppCertificate
```

The Agora App Certificate is secret. Do not commit it to GitHub and do not expose it in frontend code.

## Backend Lambda Environment Reference

Lambda functions read environment variables from AWS Lambda or from the CloudFormation deployment configuration.

Important backend environment variables include:

```env
USERS_TABLE=Users
AUCTIONS_TABLE=Auctions
BIDS_TABLE=Bids
NOTIFICATIONS_TABLE=Notifications

AGORA_APP_ID=your-agora-app-id
AGORA_APP_CERT=your-agora-app-certificate-secret

IMAGES_BUCKET_NAME=bidit-images-myname-2026

STATE_MACHINE_ARN=arn:aws:states:us-east-1:YOUR_ACCOUNT_ID:stateMachine:WinnerMachine
```

These values are normally configured automatically by the CloudFormation template.

For local reference only, you may create a `.env.lambda` file, but do not commit secrets to GitHub.

## Security Notes

Do not commit the following to GitHub:

- AWS access keys.
- AWS session tokens.
- Agora App Certificate.
- Firebase private admin credentials or service-account keys.
- `.env` files containing secrets.
- `.deploy/lambda-zips/`.
- Generated Lambda ZIP files.
- `node_modules/`.

The frontend may include Firebase web configuration and the Agora App ID. The Agora App Certificate, AWS credentials, AWS session tokens, and Firebase private admin credentials must remain secret.

For documentation and public examples, use placeholders such as:

```text
YOUR_API_ID
YOUR_ACCOUNT_ID
YOUR_AGORA_APP_ID
YOUR_AGORA_APP_CERTIFICATE
```

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
When prompted during the setup, use the following values:

AWS Access Key ID / Secret Access Key: [Your personal credentials]

Default region name: us-east-1

Default output format: json

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
  -Region us-east-1 `
  -StackName bidit-dev `
  -Stage dev `
  -ArtifactBucket my-existing-deployment-bucket `
  -ImagesBucket bidit-images-myname-2026 `
  -UseExistingLabRole true `
  -ExistingLabRoleArn arn:aws:iam::YOUR-LabRole-ARN:role/LabRole `
  -AgoraAppId your-agora-app-id `
  -AgoraAppCertificate your-agora-app-certificate
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
