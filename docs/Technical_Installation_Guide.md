# BidIt Technical Installation Guide

This guide is the section 9 source-package deployment guide for recreating the BidIt AWS infrastructure and application from a clean checkout.

## Prerequisites

- Windows PowerShell 5+ or PowerShell 7 for the Windows scripts.
- AWS CLI v2 installed and available as `aws`.
- Python 3.11+ for local validation and optional virtual environment setup.
- Node.js/npm for the Vite frontend.
- An AWS IAM principal configured with permissions for STS, Lambda, API Gateway, DynamoDB, S3, IAM PassRole for the Lambda role, and Step Functions if you create the workflow.
- An existing Lambda execution role, by default `BiditLambdaExecutionRole`.

## AWS CLI configuration

```powershell
aws configure
aws sts get-caller-identity
```

The deployment scripts detect the current account with `aws sts get-caller-identity`; no account ID is hardcoded in the source package.

## Python environment and requirements

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

`requirements.txt` contains only deployment-time AWS SDK packages. Lambda functions in this project use the Python runtime plus AWS SDK availability unless separately packaged.

## Configuration

Copy `.env.example` to your local environment file or export the values in your shell. Do not commit real secrets.

Important values:

- `AWS_REGION=us-east-1`
- `API_STAGE_NAME=dev`
- `API_GATEWAY_ID=` leave empty to create a new REST API, or set it to update an existing REST API.
- `S3_BUCKET_NAME=your-bidit-images-bucket-name`
- `STEP_FUNCTION_NAME=WinnerMachine`
- `AGORA_APP_CERT=...` set only in local secret storage or Lambda environment configuration.

## Deployment order

1. Create or verify AWS resources such as DynamoDB tables and the S3 bucket.
2. Package Lambdas.
3. Create or update Lambdas.
4. Create or update Step Functions if used by your environment.
5. Generate `swagger_deploy.json` from `swagger_api_gateway.json`.
6. Import a new API Gateway REST API, or update an existing one when `API_GATEWAY_ID` is supplied.
7. Add API Gateway invoke permissions to Lambda functions.
8. Deploy the API Gateway `dev` stage.
9. Configure the frontend with the final API invoke URL and deploy the frontend.

## One-command backend deployment on Windows

From the repository root:

```powershell
.\scripts\win\deploy-lambdas.ps1
```

To update an existing API instead of creating a duplicate API:

```powershell
$env:API_GATEWAY_ID = "your-existing-api-id"
.\scripts\win\deploy-lambdas.ps1
```

The script prints:

```text
API_GATEWAY_ID=<api-id>
VITE_API_BASE_URL=https://<api-id>.execute-api.<region>.amazonaws.com/dev
```

## Swagger source of truth

The API Gateway Swagger source file is `swagger_api_gateway.json` in the repository root. It must remain a complete Swagger 2.0 document with top-level `swagger`, `info`, `paths`, and `definitions` fields.

The verified routes include admin, Agora token, auction, upload URL, user, bid, notification, and favorites endpoints. The correct favorite deletion endpoint is:

```text
DELETE /users/{userId}/favorites/{auctionId}
```

Do not use the old incorrect route:

```text
DELETE /users/{userId}/favorites
```

## API Gateway import/update behavior

`deploy-lambdas.ps1` uses:

- `aws apigateway import-rest-api` when `API_GATEWAY_ID` is not set. This creates a new REST API from scratch.
- `aws apigateway put-rest-api --mode overwrite` when `API_GATEWAY_ID` is set. This updates the existing API and avoids accidental duplicate APIs.

After import/update, the script runs `create-deployment` for the configured stage, usually `dev`.

## Lambda ARN replacement

The exported Swagger contains Lambda integration URIs. During deployment, the script:

1. Reads `swagger_api_gateway.json` as JSON.
2. Validates that top-level `swagger` is exactly `2.0`.
3. Detects the current AWS account ID with STS.
4. Rewrites Lambda integration ARNs to the current region and account.
5. Writes a temporary UTF-8 `swagger_deploy.json`.
6. Deletes the temporary file after a successful deployment.

This preserves the Swagger structure and avoids hardcoded account IDs.

## Frontend deployment

Set the frontend API URL printed by the backend deployment:

```env
VITE_API_BASE_URL=https://<api-id>.execute-api.us-east-1.amazonaws.com/dev
VITE_AGORA_APP_ID=your-agora-app-id
```

Then build the frontend:

```powershell
.\scripts\win\deploy-frontend.ps1
```

Upload `frontend/dist` to your chosen hosting provider, such as AWS Amplify manual deployment.

## Verification

```powershell
aws lambda list-functions --region us-east-1
aws apigateway get-rest-api --rest-api-id <api-id> --region us-east-1
.\scripts\win\smoke-tests.ps1 -API_URL "https://<api-id>.execute-api.us-east-1.amazonaws.com/dev"
```

## Troubleshooting

### Invalid file URI on Windows

Do not pass `file:///C:/path/swagger_deploy.json` to AWS CLI on Windows. The fixed script passes `file://C:\path\swagger_deploy.json`, which the AWS CLI can open as a normal Windows path.

### Unable to determine OAS/Swagger version

This means API Gateway did not receive a complete Swagger/OpenAPI document. Ensure `swagger_api_gateway.json` starts with a top-level `"swagger": "2.0"` field and that generated `swagger_deploy.json` is valid JSON. The script validates both before calling AWS CLI and prints top-level keys when deployment fails.

### API Gateway CORS errors

Confirm the Swagger includes `OPTIONS` methods and `Access-Control-Allow-Origin` headers for the route. Redeploy the API Gateway stage after changes.

### Lambda permission errors

If API Gateway returns integration permission errors, rerun `deploy-lambdas.ps1`. It adds `lambda:InvokeFunction` permissions with an API-specific source ARN. If a permission statement already exists, the script continues safely.

### DynamoDB table already exists

This is usually safe. Setup scripts should treat existing tables as already provisioned. Verify the table keys match the Lambda expectations before reusing a table.

### S3 bucket name already taken

S3 bucket names are global. Use a unique `S3_BUCKET_NAME`, commonly including your AWS account ID or project suffix.

### Step Functions ARN/account mismatch

If a Lambda references a state machine ARN from another account or region, update the state machine configuration/environment value to the ARN created in the current account and region.
