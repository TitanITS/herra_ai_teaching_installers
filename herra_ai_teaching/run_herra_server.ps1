$ErrorActionPreference = "Stop"

Set-Location -Path $PSScriptRoot

$pythonExe = Join-Path $PSScriptRoot ".venv\Scripts\python.exe"
$frontendDist = Join-Path $PSScriptRoot "frontend\dist\index.html"
$backendEntry = Join-Path $PSScriptRoot "backend\server_app.py"
$bootstrapJson = Join-Path $PSScriptRoot "deployment_bootstrap.json"

if (-not (Test-Path $pythonExe)) {
    Write-Host "[ERROR] Embedded Python runtime not found at:"
    Write-Host "        $pythonExe"
    exit 1
}

if (-not (Test-Path $backendEntry)) {
    Write-Host "[ERROR] Backend entrypoint not found at:"
    Write-Host "        $backendEntry"
    exit 1
}

if (-not (Test-Path $frontendDist)) {
    Write-Host "[ERROR] Frontend production build not found at:"
    Write-Host "        $frontendDist"
    exit 1
}

if (-not (Test-Path $bootstrapJson)) {
    Write-Host "[ERROR] Deployment bootstrap file not found at:"
    Write-Host "        $bootstrapJson"
    exit 1
}

Write-Host "[INFO] Activating deployment if needed..."
& $pythonExe -m backend.license_manager activate --bootstrap-path $bootstrapJson
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Deployment activation/bootstrap failed."
    exit $LASTEXITCODE
}

Write-Host "[INFO] Starting Herra server on http://127.0.0.1:8001"
& $pythonExe -m uvicorn backend.server_app:app --host 127.0.0.1 --port 8001

exit $LASTEXITCODE