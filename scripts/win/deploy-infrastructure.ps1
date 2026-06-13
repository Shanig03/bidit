param(
  [string]$StackName = "bidit-dev", [string]$Region = "us-east-1", [string]$Stage = "dev",
  [Parameter(Mandatory=$true)][string]$ArtifactBucket, [string]$ArtifactPrefix = "bidit-lambdas",
  [Parameter(Mandatory=$true)][string]$ImagesBucket, [string]$UseExistingLabRole = "false",
  [string]$ExistingLabRoleArn = "", [string]$AgoraAppId = "", [string]$AgoraAppCertificate = ""
)
$ErrorActionPreference = "Stop"
$RootDir = Resolve-Path "$PSScriptRoot\..\.."
$ZipDir = Join-Path $RootDir ".deploy\lambda-zips"
if (!(Test-Path $ZipDir)) { throw "Missing $ZipDir. Run scripts\win\package-lambdas.ps1 first." }
if (!(Get-Command aws -ErrorAction SilentlyContinue)) { throw "AWS CLI is not installed or not on PATH." }
aws s3api head-bucket --bucket $ArtifactBucket --region $Region *> $null
if ($LASTEXITCODE -ne 0) { throw "Artifact bucket '$ArtifactBucket' does not exist or is not accessible in region '$Region'. Create it or choose a bucket your credentials can access." }
aws s3 sync "$ZipDir\" "s3://$ArtifactBucket/$ArtifactPrefix/" --region $Region
aws cloudformation deploy --template-file (Join-Path $RootDir "cloudformation\bidit-infrastructure.yaml") --stack-name $StackName --region $Region --capabilities CAPABILITY_NAMED_IAM --parameter-overrides StageName=$Stage LambdaArtifactBucket=$ArtifactBucket LambdaArtifactPrefix=$ArtifactPrefix ImagesBucketName=$ImagesBucket UseExistingLabRole=$UseExistingLabRole ExistingLabRoleArn=$ExistingLabRoleArn AgoraAppId=$AgoraAppId AgoraAppCertificate=$AgoraAppCertificate
aws cloudformation describe-stacks --stack-name $StackName --region $Region --query 'Stacks[0].Outputs' --output table
