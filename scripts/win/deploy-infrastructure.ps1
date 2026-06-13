param(
  [string]$StackName = "bidit-dev",
  [string]$Region = "us-east-1",
  [string]$Stage = "dev",

  [Parameter(Mandatory=$true)]
  [string]$ArtifactBucket,

  [string]$ArtifactPrefix = "bidit-lambdas",

  [Parameter(Mandatory=$true)]
  [string]$ImagesBucket,

  [string]$UseExistingLabRole = "false",
  [string]$ExistingLabRoleArn = "",

  [string]$AgoraAppId = "",
  [string]$AgoraAppCertificate = ""
)

$ErrorActionPreference = "Stop"

$RootDir = Resolve-Path "$PSScriptRoot\..\.."
$ZipDir = Join-Path $RootDir ".deploy\lambda-zips"
$TemplateFile = Join-Path $RootDir "cloudformation\bidit-infrastructure.yaml"
$CloudFormationPrefix = "bidit-cloudformation"

if (!(Test-Path $ZipDir)) {
  throw "Missing $ZipDir. Run scripts\win\package-lambdas.ps1 first."
}

if (!(Test-Path $TemplateFile)) {
  throw "Missing CloudFormation template: $TemplateFile"
}

if (!(Get-Command aws -ErrorAction SilentlyContinue)) {
  throw "AWS CLI is not installed or not on PATH."
}

Write-Host "Checking artifact bucket: $ArtifactBucket"
aws s3api head-bucket --bucket $ArtifactBucket --region $Region *> $null

if ($LASTEXITCODE -ne 0) {
  throw "Artifact bucket '$ArtifactBucket' does not exist or is not accessible in region '$Region'. Create it or choose a bucket your credentials can access."
}

Write-Host "Uploading Lambda zip files to s3://$ArtifactBucket/$ArtifactPrefix/"
aws s3 sync "$ZipDir\" "s3://$ArtifactBucket/$ArtifactPrefix/" --region $Region

if ($LASTEXITCODE -ne 0) {
  throw "Failed to upload Lambda zip files to s3://$ArtifactBucket/$ArtifactPrefix/"
}

Write-Host "Deploying CloudFormation stack: $StackName"
Write-Host "CloudFormation template will be uploaded to s3://$ArtifactBucket/$CloudFormationPrefix/"

aws cloudformation deploy `
  --template-file $TemplateFile `
  --stack-name $StackName `
  --region $Region `
  --s3-bucket $ArtifactBucket `
  --s3-prefix $CloudFormationPrefix `
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM `
  --no-fail-on-empty-changeset `
  --parameter-overrides `
    StageName=$Stage `
    LambdaArtifactBucket=$ArtifactBucket `
    LambdaArtifactPrefix=$ArtifactPrefix `
    ImagesBucketName=$ImagesBucket `
    UseExistingLabRole=$UseExistingLabRole `
    ExistingLabRoleArn=$ExistingLabRoleArn `
    AgoraAppId=$AgoraAppId `
    AgoraAppCertificate=$AgoraAppCertificate

if ($LASTEXITCODE -ne 0) {
  throw "CloudFormation deploy failed. Stack outputs will not be loaded because the deployment did not complete."
}

Write-Host "CloudFormation deploy completed successfully."
Write-Host "Stack outputs:"

aws cloudformation describe-stacks `
  --stack-name $StackName `
  --region $Region `
  --query 'Stacks[0].Outputs' `
  --output table

if ($LASTEXITCODE -ne 0) {
  throw "Failed to read CloudFormation stack outputs."
}