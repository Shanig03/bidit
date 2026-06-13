#!/bin/bash
# scripts/deploy-lambdas.sh

echo "Starting Backend Deployment..."

# 1. Fetch the dynamic AWS Account ID and Region
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION="us-east-1"
DYNAMIC_BUCKET_NAME="bidit-auction-images-${ACCOUNT_ID}"

echo "Configuring for AWS Account: $ACCOUNT_ID"

# 2. Update the Swagger file dynamically
# Replaces the generic placeholder with the actual AWS Account ID running the script
python3 - <<PY_SWAGGER
import json, re
from pathlib import Path
source = Path("swagger_api_gateway.json")
out = Path("swagger_deploy.json")
data = json.loads(source.read_text(encoding="utf-8-sig"))
if data.get("swagger") != "2.0":
    raise SystemExit("swagger_api_gateway.json must contain top-level swagger: 2.0")
if "info" not in data or "paths" not in data:
    raise SystemExit("swagger_api_gateway.json must contain top-level info and paths")
data.pop("host", None)
data["basePath"] = "/dev"
text = json.dumps(data, indent=2)
text = re.sub(r"arn:aws:apigateway:[^:]+:lambda:path/2015-03-31/functions/arn:aws:lambda:[^:]+:\d{12}:function:([^/]+?)/invocations", rf"arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/arn:aws:lambda:$REGION:$ACCOUNT_ID:function:\1/invocations", text)
text = text.replace("ACCOUNT_ID_PLACEHOLDER", "$ACCOUNT_ID").replace("us-east-1", "$REGION")
out.write_text(text + "\n", encoding="utf-8")
json.loads(out.read_text(encoding="utf-8"))
PY_SWAGGER

# 3. Deploy API Gateway
echo "Deploying API Gateway from Swagger..."
API_ID=$(aws apigateway import-rest-api \
  --parameters endpointConfigurationTypes=REGIONAL \
  --body 'file://swagger_deploy.json' \
  --query 'id' \
  --output text)

rm -f swagger_deploy.json
echo "✅ API Gateway deployed with ID: $API_ID"

# 4. Deploy all Lambda Functions
LAMBDA_FUNCTIONS=(
  "createUser" "updateUserProfile" "getAllUsers" "updateUserStatus" "updateUserRole"
  "getAllAuctions" "getAuction" "createAuction" "updateAuction" "deleteAuction"
  "placeBid" "getAuctionBids" "getUserBids" "addToFavorites" "getFavorites"
  "removeAuctionFromFavorites" "getNotifications" "generateS3ImageUrls"
  "generateAgoraToken" "CheckAuctionStatus" "ProcessAuctionWinner"
)

echo "Deploying ${#LAMBDA_FUNCTIONS[@]} Lambda functions..."
for func in "${LAMBDA_FUNCTIONS[@]}"; do
  cd "lambdas"
  zip -q -r "../${func}.zip" "${func}.py" -x "*.git*"
  cd ..
  
  if aws lambda get-function --function-name "$func" --region "$REGION" 2>/dev/null; then
    aws lambda update-function-code \
      --function-name "$func" \
      --zip-file "fileb://${func}.zip" \
      --region "$REGION" > /dev/null
  else
    aws lambda create-function \
      --function-name "$func" \
      --runtime python3.11 \
      --role "arn:aws:iam::${ACCOUNT_ID}:role/BiditLambdaExecutionRole" \
      --handler "${func}.lambda_handler" \
      --zip-file "fileb://${func}.zip" \
      --timeout 60 \
      --memory-size 256 \
      --region "$REGION" \
      --environment "Variables={BUCKET_NAME=$DYNAMIC_BUCKET_NAME}" > /dev/null
  fi
  
  rm "${func}.zip"
done

echo "✅ All Lambda functions deployed successfully!"
echo "⚠️ IMPORTANT: Update your frontend/.env file with this API URL:"
echo "VITE_API_BASE_URL=https://${API_ID}.execute-api.${REGION}.amazonaws.com/dev"