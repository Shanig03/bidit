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
  if ((Test-Path $ReqFile) -and $name -eq "generateAgoraToken") {
    Write-Host "Installing Python dependencies for $name from $ReqFile"
    python -m pip install -r $ReqFile -t $work --quiet
    if ($LASTEXITCODE -ne 0) { throw "Failed to install Python dependencies for $name. Ensure this machine has internet/PyPI access, or preinstall/vendor dependencies before packaging (AWS Academy/VocLabs may block PyPI)." }
  }
  Compress-Archive -Path (Join-Path $work "*") -DestinationPath (Join-Path $OutDir "$name.zip") -Force
  Write-Host "Packaged $name.zip"
}
Write-Host "Lambda zips written to $OutDir"
