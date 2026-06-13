# scripts/win/deploy-frontend.ps1
Write-Host "Building React Frontend..." -ForegroundColor Cyan
Set-Location frontend
npm install
npm run build
Write-Host "Build complete! Upload the 'frontend/dist' folder to AWS Amplify." -ForegroundColor Green