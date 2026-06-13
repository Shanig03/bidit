Write-Host "Starting setup..." -ForegroundColor Cyan

$ACCOUNT_ID = (aws sts get-caller-identity --query Account --output text)
$DEV_BUCKET = "bidit-auction-images-dev-" + $ACCOUNT_ID
$REGION = "us-east-1"

function New-DynamoTable {
    param($cmd)
    try {
        Invoke-Expression $cmd
        Write-Host "Table processed." -ForegroundColor Green
    } catch {
        Write-Host "Table likely exists." -ForegroundColor Yellow
    }
}

New-DynamoTable "aws dynamodb create-table --table-name Users --attribute-definitions AttributeName=userId,AttributeType=S --key-schema AttributeName=userId,KeyType=HASH --billing-mode PAY_PER_REQUEST --region $REGION"
New-DynamoTable "aws dynamodb create-table --table-name Auctions --attribute-definitions AttributeName=auctionId,AttributeType=S --key-schema AttributeName=auctionId,KeyType=HASH --billing-mode PAY_PER_REQUEST --region $REGION"

aws dynamodb create-table --table-name Bids --attribute-definitions AttributeName=auctionId,AttributeType=S AttributeName=placedAt,AttributeType=S AttributeName=bidderId,AttributeType=S --key-schema AttributeName=auctionId,KeyType=HASH AttributeName=placedAt,KeyType=RANGE --global-secondary-indexes file://scripts/win/bids-gsi.json --billing-mode PAY_PER_REQUEST --region $REGION

aws dynamodb create-table --table-name Notifications --attribute-definitions AttributeName=userId,AttributeType=S AttributeName=notificationId,AttributeType=S --key-schema AttributeName=userId,KeyType=HASH AttributeName=notificationId,KeyType=RANGE --billing-mode PAY_PER_REQUEST --region $REGION

aws s3 mb s3://$DEV_BUCKET --region $REGION 2>$null
aws s3api put-bucket-versioning --bucket $DEV_BUCKET --versioning-configuration Status=Enabled

$cors = '{"CORSRules":[{"AllowedHeaders":["*"],"AllowedMethods":["GET","PUT","POST","DELETE","HEAD"],"AllowedOrigins":["*"],"ExposeHeaders":["ETag"]}]}'
$cors | Set-Content s3-cors-config.json
aws s3api put-bucket-cors --bucket $DEV_BUCKET --cors-configuration file://s3-cors-config.json

Write-Host "SETUP COMPLETE" -ForegroundColor Green
Write-Host "BUCKET_NAME=$DEV_BUCKET"