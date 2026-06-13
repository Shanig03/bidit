# BidIt Deployment Scripts

These scripts recreate the AWS side of the BidIt project using Python and `boto3`. Run them from the repository root after copying `.env.example` to `.env` and filling in safe project-specific values.

## Setup

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
pip install -r scripts/requirements.txt
```

On Windows PowerShell:

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r backend/requirements.txt
pip install -r scripts/requirements.txt
```

## Script Reference

- `setup_aws_resources.py` creates or verifies DynamoDB tables, the private S3 image bucket with CORS, Lambda IAM role, and Step Functions IAM role.
- `package_lambdas.py` packages each Python Lambda source file from `backend/lambdas` into `dist/lambdas/*.zip`, installing only non-runtime dependencies such as `agora-token-builder` into each zip.
- `deploy_lambdas.py` creates or updates AWS Lambda functions, sets handlers, runtime, memory, timeout, IAM role, and environment variables.
- `deploy_step_functions.py` creates or updates the Standard Step Functions state machine named by `STEP_FUNCTION_NAME` for auction closing and winner processing.
- `configure_api_gateway.py` imports `api/swagger_api_gateway.json`, injects Lambda proxy integrations, deploys the REST API stage, grants API Gateway permission to invoke each Lambda, and writes the invoke URL to `dist/deployment_outputs.json`.
- `deploy_all.py` runs the full deployment in order: AWS resources, Lambda packaging, Lambda deployment, Step Functions deployment, Lambda redeployment with the generated state machine ARN, and API Gateway configuration.
- `cleanup_aws_resources.py` deletes scripted BidIt resources from a test AWS account after confirmation. It deletes DynamoDB tables and the S3 bucket only when `DELETE_DATA=true` is set.

## Outputs

Generated values are written to `dist/deployment_outputs.json`, including Lambda ARNs, Step Functions ARN, API Gateway ID, and the final API invoke URL. Use `api_invoke_url` as `VITE_API_BASE_URL` for the frontend.

## Safety Notes

- The scripts never require AWS access keys in files. Use AWS CLI profiles, environment credentials, or an assumed role.
- Do not commit `.env`, `dist/`, Lambda zip files, Firebase secrets, Agora certificates, private keys, or AWS credentials.
- The cleanup script intentionally requires typed confirmation and skips DynamoDB/S3 data deletion unless `DELETE_DATA=true` is set.
