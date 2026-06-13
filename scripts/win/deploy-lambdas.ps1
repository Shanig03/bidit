# scripts/win/deploy-lambdas.ps1
# Deploys BidIt Lambda functions and imports the API Gateway Swagger on Windows PowerShell.

param(
    [string]$Region = $(if ($env:AWS_REGION) { $env:AWS_REGION } else { "us-east-1" }),
    [string]$StageName = $(if ($env:API_STAGE_NAME) { $env:API_STAGE_NAME } else { "dev" }),
    [string]$ApiName = $(if ($env:API_GATEWAY_NAME) { $env:API_GATEWAY_NAME } else { "BiditAPI" }),
    [string]$RoleName = $(if ($env:LAMBDA_ROLE_NAME) { $env:LAMBDA_ROLE_NAME } else { "BiditLambdaExecutionRole" }),
    [string]$ExistingApiId = $env:API_GATEWAY_ID
)

$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..\..")
$ProjectRoot = (Get-Location).Path

function Fail($Message) {
    Write-Host "ERROR: $Message" -ForegroundColor Red
    exit 1
}

function Invoke-AwsText($Arguments, $ErrorMessage) {
    $output = & aws @Arguments 2>&1
    if ($LASTEXITCODE -ne 0) {
        Fail "$ErrorMessage`n$output"
    }
    return ($output | Out-String).Trim()
}

function Test-CommandExists($CommandName) {
    return $null -ne (Get-Command $CommandName -ErrorAction SilentlyContinue)
}

if (-not (Test-CommandExists "aws")) { Fail "AWS CLI is not installed or not available on PATH." }

$AccountId = Invoke-AwsText @("sts", "get-caller-identity", "--query", "Account", "--output", "text", "--region", $Region) "Unable to determine AWS account ID. Run 'aws configure' first."
$RoleArn = "arn:aws:iam::$AccountId:role/$RoleName"
$InputSwagger = Join-Path $ProjectRoot "swagger_api_gateway.json"
$OutputSwagger = Join-Path $ProjectRoot "swagger_deploy.json"

if (-not (Test-Path $InputSwagger)) { Fail "swagger_api_gateway.json was not found in the project root: $ProjectRoot" }

$Functions = @(
    "createUser", "updateUserProfile", "getAllUsers", "updateUserStatus", "updateUserRole",
    "getAllAuctions", "getAuction", "createAuction", "updateAuction", "deleteAuction",
    "placeBid", "getAuctionBids", "getUserBids", "addToFavorites", "getFavorites",
    "removeAuctionFromFavorites", "getNotifications", "generateS3ImageUrls", "generateAgoraToken",
    "CheckAuctionStatus", "ProcessAuctionWinner"
)

Write-Host "Deploying BidIt backend in account $AccountId, region $Region" -ForegroundColor Cyan

# 1. Package and deploy Lambdas before API import so integrations can point at real functions.
foreach ($func in $Functions) {
    $source = Join-Path $ProjectRoot "lambdas\$func.py"
    if (-not (Test-Path $source)) { Fail "Missing Lambda source file: $source" }

    Write-Host "Processing Lambda $func..." -ForegroundColor Yellow
    $zipFile = Join-Path $ProjectRoot "$func.zip"
    if (Test-Path $zipFile) { Remove-Item $zipFile -Force }
    Compress-Archive -Path $source -DestinationPath $zipFile -Force

    & aws lambda get-function --function-name $func --region $Region *> $null
    if ($LASTEXITCODE -eq 0) {
        Invoke-AwsText @("lambda", "update-function-code", "--function-name", $func, "--zip-file", "fileb://$zipFile", "--region", $Region, "--output", "text") "Failed to update Lambda function $func." | Out-Null
        Write-Host "  -> Updated." -ForegroundColor Green
    } else {
        Invoke-AwsText @("lambda", "create-function", "--function-name", $func, "--runtime", "python3.11", "--role", $RoleArn, "--handler", "$func.lambda_handler", "--zip-file", "fileb://$zipFile", "--timeout", "60", "--memory-size", "256", "--region", $Region, "--output", "text") "Failed to create Lambda function $func. Verify IAM role $RoleArn exists and has Lambda execution permissions." | Out-Null
        Write-Host "  -> Created." -ForegroundColor Green
    }
    Remove-Item $zipFile -Force
}

# 2. Generate a clean deploy Swagger without modifying the source export.
Write-Host "Generating deployment Swagger..." -ForegroundColor Cyan
try {
    $swagger = Get-Content -Raw -Path $InputSwagger | ConvertFrom-Json -Depth 100
} catch {
    Fail "swagger_api_gateway.json is not valid JSON. $($_.Exception.Message)"
}

if ($swagger.swagger -ne "2.0") { Fail "swagger_api_gateway.json must contain top-level 'swagger': '2.0'. Current value: '$($swagger.swagger)'" }
if ($null -eq $swagger.info -or $null -eq $swagger.paths) { Fail "swagger_api_gateway.json must contain top-level 'info' and 'paths' objects." }

$swagger.PSObject.Properties.Remove("host")
$swagger.basePath = "/$StageName"
$json = $swagger | ConvertTo-Json -Depth 100
$json = $json -replace 'arn:aws:apigateway:[^:]+:lambda:path/2015-03-31/functions/arn:aws:lambda:[^:]+:\d{12}:function:([^/]+?)/invocations', "arn:aws:apigateway:$Region`:lambda:path/2015-03-31/functions/arn:aws:lambda:$Region`:$AccountId`:function:`$1/invocations"
$json = $json -replace 'ACCOUNT_ID_PLACEHOLDER', $AccountId
$json = $json -replace 'us-east-1', $Region
[System.IO.File]::WriteAllText($OutputSwagger, $json, (New-Object System.Text.UTF8Encoding $false))

try {
    $deploySwagger = Get-Content -Raw -Path $OutputSwagger | ConvertFrom-Json -Depth 100
} catch {
    Fail "Generated swagger_deploy.json is not valid JSON. $($_.Exception.Message)"
}
if ($deploySwagger.swagger -ne "2.0") { Fail "Generated swagger_deploy.json is missing top-level 'swagger': '2.0'." }
Write-Host "Swagger top-level keys: $((($deploySwagger | Get-Member -MemberType NoteProperty).Name) -join ', ')" -ForegroundColor DarkGray

# AWS CLI on Windows accepts file:// followed by a normal absolute path, for example file://C:\repo\swagger_deploy.json.
$BodyParam = "file://$OutputSwagger"

# 3. Import a new API or update an existing one when API_GATEWAY_ID/-ExistingApiId is supplied.
Write-Host "Deploying API Gateway..." -ForegroundColor Cyan
if ([string]::IsNullOrWhiteSpace($ExistingApiId)) {
    $ApiId = Invoke-AwsText @("apigateway", "import-rest-api", "--parameters", "endpointConfigurationTypes=REGIONAL", "--body", $BodyParam, "--query", "id", "--output", "text", "--region", $Region) "API Gateway import-rest-api failed. Generated Swagger keys: $((($deploySwagger | Get-Member -MemberType NoteProperty).Name) -join ', ')."
    Write-Host "Created new API Gateway REST API: $ApiId" -ForegroundColor Green
} else {
    $ApiId = $ExistingApiId.Trim()
    Invoke-AwsText @("apigateway", "put-rest-api", "--rest-api-id", $ApiId, "--mode", "overwrite", "--parameters", "endpointConfigurationTypes=REGIONAL", "--body", $BodyParam, "--region", $Region, "--output", "text") "API Gateway put-rest-api failed for API $ApiId."
    Write-Host "Updated existing API Gateway REST API: $ApiId" -ForegroundColor Green
}

# 4. Allow this API Gateway REST API to invoke each Lambda.
foreach ($func in $Functions) {
    $statementId = "apigateway-$ApiId-$func" -replace '[^A-Za-z0-9-_]', '-'
    & aws lambda add-permission --function-name $func --statement-id $statementId --action lambda:InvokeFunction --principal apigateway.amazonaws.com --source-arn "arn:aws:execute-api:$Region`:$AccountId`:$ApiId/*/*/*" --region $Region *> $null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  -> Permission already exists or could not be added for $func; continuing." -ForegroundColor DarkYellow
    }
}

Invoke-AwsText @("apigateway", "create-deployment", "--rest-api-id", $ApiId, "--stage-name", $StageName, "--region", $Region, "--output", "text") "Failed to create API Gateway deployment for stage $StageName." | Out-Null
Remove-Item $OutputSwagger -ErrorAction SilentlyContinue

Write-Host "Backend deployment complete." -ForegroundColor Green
Write-Host "API_GATEWAY_ID=$ApiId" -ForegroundColor Yellow
Write-Host "VITE_API_BASE_URL=https://$ApiId.execute-api.$Region.amazonaws.com/$StageName" -ForegroundColor Yellow
