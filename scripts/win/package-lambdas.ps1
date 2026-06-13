$ErrorActionPreference = "Stop"
$RootDir = Resolve-Path "$PSScriptRoot\..\.."
$LambdaDir = Join-Path $RootDir "lambdas"
$BuildDir = Join-Path $RootDir ".deploy\lambda-build"
$OutDir = Join-Path $RootDir ".deploy\lambda-zips"
$ReqFile = Join-Path $RootDir "backend\requirements.txt"
Remove-Item $BuildDir,$OutDir -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path $BuildDir,$OutDir | Out-Null
Get-ChildItem $LambdaDir -Filter *.py | ForEach-Object {
  $name = $_.BaseName; $work = Join-Path $BuildDir $name
  New-Item -ItemType Directory -Path $work | Out-Null
  Copy-Item $_.FullName $work
  if ((Test-Path $ReqFile) -and $name -eq "generateAgoraToken") { python -m pip install -r $ReqFile -t $work --quiet }
  Compress-Archive -Path (Join-Path $work "*") -DestinationPath (Join-Path $OutDir "$name.zip") -Force
  Write-Host "Packaged $name.zip"
}
Write-Host "Lambda zips written to $OutDir"
