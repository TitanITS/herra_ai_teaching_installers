@echo off
setlocal

cd /d "%~dp0"

if not exist ".venv\Scripts\python.exe" (
    echo [ERROR] Root virtual environment not found at:
    echo %cd%\.venv\Scripts\python.exe
    echo.
    echo Create it first with:
    echo py -3.13 -m venv .venv
    pause
    exit /b 1
)

if not exist "frontend\dist\index.html" (
    echo [INFO] Frontend production build not found. Building now...
    pushd "frontend"
    call npm run build
    if errorlevel 1 (
        echo [ERROR] Frontend build failed.
        popd
        pause
        exit /b 1
    )
    popd
)

echo [INFO] Starting Herra server on http://127.0.0.1:8001
echo [INFO] Press CTRL+C to stop the server.
echo.

call ".venv\Scripts\python.exe" -m uvicorn backend.server_app:app --host 127.0.0.1 --port 8001

endlocal