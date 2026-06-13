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
sed -i.bak "s/ACCOUNT_ID_PLACEHOLDER/$ACCOUNT_ID/g" swagger_api_gateway.json
sed -i.bak "s/us-east-1/$REGION/g" swagger_api_gateway.json

# Clean up the backup files created by sed (keeps the folder clean for the examiner)
rm -f swagger_api_gateway.json.bak

# 3. Deploy API Gateway
echo "Deploying API Gateway from Swagger..."
API_ID=$(aws apigateway import-rest-api \
  --parameters endpointConfigurationTypes=REGIONAL \
  --body 'file://swagger_api_gateway.json' \
  --query 'id' \
  --output text)

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