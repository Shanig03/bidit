# scripts/win/smoke-tests.ps1
param([string]$API_URL)

if (-not $API_URL) { Write-Error "Please provide API URL"; exit }

Write-Host "Running tests against $API_URL"
$res = Invoke-WebRequest -Uri "$API_URL/auctions" -Method Get
if ($res.StatusCode -eq 200) { Write-Host "✅ Auctions API OK" }