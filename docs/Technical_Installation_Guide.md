# BidIt Technical Installation Guide

## 1. Package Contents

This delivery package contains the BidIt application source plus deployment assets:

- `frontend/` - React/Vite frontend application.
- `lambdas/` - original Lambda source files kept in their existing project location.
- `backend/lambdas/` - deployable copy of the Lambda source files used by the packaging scripts.
- `backend/requirements.txt` - Python dependencies for Lambda packaging and local deployment tooling.
- `api/swagger_api_gateway.json` - Swagger 2.0 API Gateway import file with BidIt routes and Lambda proxy integration placeholders.
- `scripts/` - boto3-based installation, deployment, packaging, API Gateway, Step Functions, and cleanup scripts.
- `docs/` - technical installation and operations documentation.
- `.env.example` - safe placeholder configuration template.

## 2. Prerequisites

A technical developer needs the following before deploying BidIt into a clean AWS account:

- AWS account dedicated to testing or project deployment.
- AWS CLI installed and configured with credentials for the target account.
- Python 3.11+; Python 3.12 is recommended because the scripts deploy Lambdas with `python3.12` by default.
- Node.js and npm for the Vite frontend.
- Firebase project with Authentication enabled.
- Google sign-in enabled in Firebase Authentication if Google login is used.
- Firebase Realtime Database if chat, viewer presence, or blocked user status features are used by the frontend.
- Agora project for live video streaming.
- IAM permissions to create/update DynamoDB tables, S3 buckets, IAM roles/policies, Lambda functions, Step Functions state machines, API Gateway REST APIs, CloudWatch Logs, and Lambda permissions.
- Default deployment region: `us-east-1`.

## 3. Configuration

1. Copy the example environment file:

   ```bash
   cp .env.example .env
   ```

   Windows PowerShell:

   ```powershell
   Copy-Item .env.example .env
   ```

2. Edit `.env` and replace placeholder values:

   - `AWS_REGION`, usually `us-east-1`.
   - `PROJECT_NAME`, usually `BidIt`.
   - `API_STAGE_NAME`, usually `dev`.
   - DynamoDB table names if you do not want the defaults.
   - `S3_BUCKET_NAME`; S3 bucket names must be globally unique.
   - Firebase `VITE_FIREBASE_*` values from your Firebase web app configuration.
   - `VITE_AGORA_APP_ID`, `AGORA_APP_ID`, and `AGORA_APP_CERT` from Agora.

3. Never commit real `.env` files, AWS credentials, Firebase secrets, Agora certificates, service account keys, or private keys.

## 4. AWS Deployment Using Scripts

From the repository root, create a virtual environment and install dependencies.

Linux/macOS:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
pip install -r scripts/requirements.txt
python scripts/deploy_all.py
```

Windows PowerShell:

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r backend/requirements.txt
pip install -r scripts/requirements.txt
python scripts/deploy_all.py
```

The all-in-one deployment runs in this order:

1. `setup_aws_resources.py`
2. `package_lambdas.py`
3. `deploy_lambdas.py`
4. `deploy_step_functions.py`
5. `deploy_lambdas.py` again so functions receive the generated `STEP_FUNCTION_ARN`
6. `configure_api_gateway.py`

Generated deployment values are written to `dist/deployment_outputs.json`. After deployment, copy `api_invoke_url` into `VITE_API_BASE_URL` for the frontend environment.

## 5. Frontend Setup

Run the frontend locally:

```bash
cd frontend
npm install
npm run dev
```

Build for production:

```bash
cd frontend
npm install
npm run build
```

`VITE_API_BASE_URL` must point to the deployed API Gateway invoke URL, for example:

```env
VITE_API_BASE_URL=https://your-api-id.execute-api.us-east-1.amazonaws.com/dev
```

## 6. DynamoDB Tables

The deployment script creates the following DynamoDB tables using on-demand billing.

| Table | Primary key | Indexes | Purpose |
| --- | --- | --- | --- |
| `Users` | `userId` string partition key | None | Stores user profile, role, status, favorite auction set, bid history references, and won auction records. |
| `Auctions` | `auctionId` string partition key | None | Stores auction listing data, seller data, image keys, current price, bid count, highest bidder, start/end time, and final winner fields. |
| `Bids` | `auctionId` string partition key, `placedAt` string sort key | `bidderId-placedAt-index` with `bidderId` partition key and `placedAt` sort key | Stores accepted bids for each auction and supports querying a user's bids. |
| `Notifications` | `userId` string partition key, `notificationId` string sort key | None | Stores user notifications, including auction winner notifications. |
| `Favorites` | `userId` string partition key, `auctionId` string sort key | None | Included for delivery completeness. The current Lambda implementation stores favorites in the `Users` table as a set, so this table may remain unused unless the data model is later normalized. |

Assumption: the key structures above are inferred from the current Lambda source. If a future Lambda changes key usage, update `scripts/setup_aws_resources.py` before redeploying into a clean account.

## 7. S3 Bucket

The image bucket is configured as private by default. Public access is blocked, and images are uploaded/read through presigned URLs created by the `generateS3ImageUrls` Lambda.

The script configures CORS to allow browser `GET`, `PUT`, `POST`, and `HEAD` requests. This supports direct browser upload using a presigned `PUT` URL and temporary image viewing using a presigned `GET` URL.

## 8. Lambda Functions

The deployment script maps each Lambda source file in `backend/lambdas` to an AWS Lambda named `BidIt-<sourceFileStem>` by default.

| Lambda | Handler | Purpose | Timeout | Memory |
| --- | --- | --- | --- | --- |
| `BidIt-createAuction` | `createAuction.lambda_handler` | Creates an auction and starts the Step Functions closing workflow. | 30s | 256 MB |
| `BidIt-getAuction` | `getAuction.lambda_handler` | Gets one auction by `auctionId`. | 30s | 256 MB |
| `BidIt-getAllAuctions` | `getAllAuctions.lambda_handler` | Lists auctions for frontend/admin views. | 30s | 256 MB |
| `BidIt-getLiveAuctions` | `getLiveAuctions.lambda_handler` | Lists live auctions where routed. | 30s | 256 MB |
| `BidIt-updateAuction` | `updateAuction.lambda_handler` | Updates auction fields, including image keys and status. | 30s | 256 MB |
| `BidIt-deleteAuction` | `deleteAuction.lambda_handler` | Deletes an auction for admin management. | 30s | 256 MB |
| `BidIt-placeBid` | `placeBid.lambda_handler` | Validates and places a bid, updates current price, and handles anti-sniping extension. | 30s | 256 MB |
| `BidIt-getAuctionBids` | `getAuctionBids.lambda_handler` | Lists bids for an auction. | 30s | 256 MB |
| `BidIt-getUserBids` | `getUserBids.lambda_handler` | Lists bids made by a user through the `bidderId-placedAt-index` GSI. | 30s | 256 MB |
| `BidIt-createUser` | `createUser.lambda_handler` | Creates a user profile record after Firebase signup/login. | 30s | 256 MB |
| `BidIt-updateUserProfile` | `updateUserProfile.lambda_handler` | Gets or updates a user profile. | 30s | 256 MB |
| `BidIt-getAllUsers` | `getAllUsers.lambda_handler` | Lists users for admin management. | 30s | 256 MB |
| `BidIt-updateUserStatus` | `updateUserStatus.lambda_handler` | Updates user active/blocked status. | 30s | 256 MB |
| `BidIt-updateUserRole` | `updateUserRole.lambda_handler` | Updates user role. | 30s | 256 MB |
| `BidIt-addToFavorites` | `addToFavorites.lambda_handler` | Adds an auction to a user's favorites. | 30s | 256 MB |
| `BidIt-getFavorites` | `getFavorites.lambda_handler` | Gets a user's favorite auctions. | 30s | 256 MB |
| `BidIt-removeAuctionFromFavorites` | `removeAuctionFromFavorites.lambda_handler` | Removes an auction from favorites. | 30s | 256 MB |
| `BidIt-getNotifications` | `getNotifications.lambda_handler` | Lists notifications for a user. | 30s | 256 MB |
| `BidIt-generateS3ImageUrls` | `generateS3ImageUrls.lambda_handler` | Creates presigned S3 upload/view URLs. | 30s | 256 MB |
| `BidIt-generateAgoraToken` | `generateAgoraToken.lambda_handler` | Creates Agora RTC tokens. Requires packaged `agora-token-builder`. | 10s | 256 MB |
| `BidIt-CheckAuctionStatus` | `CheckAuctionStatus.lambda_handler` | Checks whether an auction has ended for Step Functions. | 60s | 256 MB |
| `BidIt-ProcessAuctionWinner` | `ProcessAuctionWinner.lambda_handler` | Finalizes ended auctions and creates winner notifications. | 60s | 256 MB |

The Lambda IAM role receives DynamoDB read/write access to the project tables, S3 object access to the image bucket, permission to start the configured state machine, and CloudWatch Logs permissions.

## 9. API Gateway

The API Gateway definition is stored at `api/swagger_api_gateway.json`. The `configure_api_gateway.py` script loads this file, replaces Lambda integration placeholders with deployed Lambda ARNs, imports or overwrites the REST API, deploys the configured stage, and prints the final invoke URL.

The final URL is also saved in `dist/deployment_outputs.json` as `api_invoke_url`.

If import fails because of a local customization, inspect the API Gateway error message, correct `api/swagger_api_gateway.json`, and rerun:

```bash
python scripts/configure_api_gateway.py
```

## 10. Step Functions

The state machine name defaults to `WinnerMachine` and is configurable with `STEP_FUNCTION_NAME`.

Workflow:

1. Wait until the auction `endTime`.
2. Invoke `CheckAuctionStatus`.
3. If the auction is over, invoke `ProcessAuctionWinner`.
4. If the auction was extended, wait until the updated `endTime` and check again.

The `createAuction` Lambda reads `STEP_FUNCTION_ARN` from environment variables. The deployment script redeploys Lambdas after creating Step Functions so the generated ARN is included in Lambda environment variables without hardcoding an AWS account ID.

## 11. Firebase Setup

Firebase is not automated by these AWS deployment scripts. Configure it manually in the Firebase console:

- Create or select a Firebase project.
- Enable Firebase Authentication.
- Enable email/password login if used by the frontend.
- Enable Google sign-in if used by the frontend.
- Add authorized domains for local development and deployed frontend hosting.
- Create a Firebase Realtime Database if chat, viewer presence, or blocked user status functionality is enabled.
- Copy the Firebase web app values into `.env` as `VITE_FIREBASE_*` placeholders.

## 12. Agora Setup

Agora is not automated by these AWS deployment scripts. Create an Agora project, copy the App ID to `VITE_AGORA_APP_ID` and `AGORA_APP_ID`, and provide the App Certificate as `AGORA_APP_CERT` for the token Lambda. Do not commit the real App Certificate.

## 13. Verification Checklist

Use this checklist after deployment:

- [ ] User can sign up.
- [ ] User can log in.
- [ ] User can create auction.
- [ ] Image uploads to S3 using a presigned URL.
- [ ] Auction appears in live auctions.
- [ ] Bid can be placed.
- [ ] Current price updates.
- [ ] Recent bids are shown.
- [ ] Step Functions execution starts after auction creation.
- [ ] Auction closes after end time.
- [ ] Winner notification is created.
- [ ] Admin can manage users.
- [ ] Admin can delete auctions.

## 14. Troubleshooting

| Issue | Likely cause | Fix |
| --- | --- | --- |
| CORS error | API Gateway CORS preflight or Lambda response headers are not matching the frontend request. | Rerun `configure_api_gateway.py`; verify OPTIONS routes and Lambda CORS headers. |
| Missing environment variable | `.env` was not copied or a placeholder was left blank. | Copy `.env.example` to `.env`, fill values, and redeploy affected resources. |
| Lambda permission error | IAM role policy is missing table, S3, Step Functions, or CloudWatch Logs permissions. | Rerun `setup_aws_resources.py`; inspect the `BidItLambdaAccessPolicy` inline policy. |
| API Gateway integration error | Swagger import did not receive Lambda integration URIs or Lambda permissions. | Rerun `deploy_lambdas.py` and `configure_api_gateway.py`; check `dist/deployment_outputs.json`. |
| S3 presigned URL expired | Upload/view URL lifetime is temporary by design. | Request a new upload or view URL from `/upload-url`. |
| DynamoDB table not found | Tables were not created in the configured region or names differ from Lambda expectations. | Verify `AWS_REGION` and table names, then rerun `setup_aws_resources.py`. |
| Step Function does not start | `STEP_FUNCTION_ARN` is wrong or Lambda lacks `states:StartExecution`. | Rerun `deploy_all.py`; verify `STEP_FUNCTION_ARN` in Lambda environment and IAM policy. |
| Firebase login error | Firebase Auth provider, authorized domain, or frontend config is incorrect. | Check Firebase console settings and `VITE_FIREBASE_*` values. |
| Agora video not visible | Agora App ID/certificate or token generation is incorrect. | Verify `VITE_AGORA_APP_ID`, `AGORA_APP_ID`, `AGORA_APP_CERT`, and the `/agora/token` API route. |

## Manual Steps That Remain

- Configure Firebase project, Authentication providers, authorized domains, and Realtime Database rules manually.
- Configure Agora project and provide real App ID/certificate through local environment or secure CI/CD secrets.
- Host the production frontend if required; these scripts focus on AWS backend recreation.
- Review `api/swagger_api_gateway.json` if additional routes are added later.
