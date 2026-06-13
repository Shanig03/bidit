# scripts/win/deploy-lambdas.ps1
# Forces context to the project root
Set-Location $PSScriptRoot\..\..

# 1. Configuration
$ACCOUNT_ID = (aws sts get-caller-identity --query Account --output text).Trim()
$REGION = "us-east-1"
$RoleArn = "arn:aws:iam::$ACCOUNT_ID:role/BiditLambdaExecutionRole"
$inputSwagger = Join-Path (Get-Location) "swagger_api_gateway.json"
$outputSwagger = Join-Path (Get-Location) "swagger_deploy.json"

if (-not (Test-Path $inputSwagger)) {
    Write-Error "ERROR: swagger_api_gateway.json not found in root."
    exit
}

# 2. Update Swagger (Strict ASCII to avoid AWS errors)
Write-Host "Updating Swagger..." -ForegroundColor Cyan
$rawJson = [System.IO.File]::ReadAllText($inputSwagger)
$cleanJson = $rawJson -replace 'ACCOUNT_ID_PLACEHOLDER', $ACCOUNT_ID
# Replacing the hardcoded ID just in case
$cleanJson = $cleanJson -replace '654654233181', $ACCOUNT_ID

# Write strictly as ASCII to prevent BOM/Encoding errors
[System.IO.File]::WriteAllText($outputSwagger, $cleanJson, [System.Text.Encoding]::ASCII)

# 3. Deploy API Gateway
Write-Host "Deploying API Gateway..." -ForegroundColor Cyan
# AWS CLI on Windows handles "file://C:\path\to\file" format
$bodyParam = "file://" + $outputSwagger

$API_RESULT = aws apigateway import-rest-api `
    --parameters endpointConfigurationTypes=REGIONAL `
    --body $bodyParam `
    --query 'id' `
    --output text 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "API Gateway Import Failed. Check your JSON syntax." -ForegroundColor Red
    Write-Host "Error Details: $API_RESULT" -ForegroundColor Yellow
    Remove-Item $outputSwagger -ErrorAction SilentlyContinue
    exit
}

$API_ID = $API_RESULT.ToString().Trim()
Write-Host "✅ API Gateway deployed with ID: $API_ID" -ForegroundColor Green
Remove-Item $outputSwagger -ErrorAction SilentlyContinue

# 4. Deploy Lambdas
$Functions = @("createUser", "updateUserProfile", "getAllUsers", "updateUserStatus", "updateUserRole", "getAllAuctions", "getAuction", "createAuction", "updateAuction", "deleteAuction", "placeBid", "getAuctionBids", "getUserBids", "addToFavorites", "getFavorites", "removeAuctionFromFavorites", "getNotifications", "generateS3ImageUrls", "generateAgoraToken", "CheckAuctionStatus", "ProcessAuctionWinner")

foreach ($func in $Functions) {
    Write-Host "Processing $func..." -ForegroundColor Yellow
    $zipFile = "$func.zip"
    
    Compress-Archive -Path "lambdas\$func.py" -DestinationPath $zipFile -Force
    
    $check = aws lambda get-function --function-name $func --region $REGION 2>$null
    
    if ($null -ne $check) {
        aws lambda update-function-code --function-name $func --zip-file "fileb://$zipFile" --region $REGION | Out-Null
        Write-Host "  -> Updated." -ForegroundColor Green
    } else {
        aws lambda create-function --function-name $func --runtime python3.11 --role $RoleArn --handler "$func.lambda_handler" --zip-file "fileb://$zipFile" --timeout 60 --memory-size 256 --region $REGION | Out-Null
        Write-Host "  -> Created." -ForegroundColor Green
    }
    Remove-Item $zipFile
}

Write-Host "✅ Backend Deployment Complete." -ForegroundColor Green
Write-Host "VITE_API_BASE_URL=https://$API_ID.execute-api.$REGION.amazonaws.com/dev" -ForegroundColor Yellow