$ErrorActionPreference = "Stop"

Set-Location -Path $PSScriptRoot

$pythonExe = Join-Path $PSScriptRoot ".venv\Scripts\python.exe"
$frontendDir = Join-Path $PSScriptRoot "frontend"
$frontendDist = Join-Path $PSScriptRoot "frontend\dist\index.html"

if (-not (Test-Path $pythonExe)) {
    Write-Host "[ERROR] Root virtual environment not found at:"
    Write-Host "        $pythonExe"
    exit 1
}

if (-not (Test-Path $frontendDist)) {
    Write-Host "[INFO] Frontend production build not found. Building now..."
    Push-Location $frontendDir
    try {
        npm run build
        if ($LASTEXITCODE -ne 0) {
            Write-Host "[ERROR] Frontend build failed."
            exit 1
        }
    }
    finally {
        Pop-Location
    }
}

Write-Host "[INFO] Starting Herra server on http://127.0.0.1:8001"
& $pythonExe -m uvicorn backend.server_app:app --host 127.0.0.1 --port 8001

exit $LASTEXITCODE