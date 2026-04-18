@echo off
setlocal

cd /d "%~dp0"

echo ==========================================
echo Herra Server Windows Setup
echo ==========================================
echo.

where py >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Python launcher 'py' was not found.
    echo Install Python 3.13 and make sure the launcher is available.
    pause
    exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
    echo [ERROR] npm was not found.
    echo Install Node.js and make sure npm is available.
    pause
    exit /b 1
)

if not exist ".venv\Scripts\python.exe" (
    echo [INFO] Creating root virtual environment...
    py -3.13 -m venv .venv
    if errorlevel 1 (
        echo [ERROR] Failed to create virtual environment with Python 3.13.
        pause
        exit /b 1
    )
) else (
    echo [INFO] Existing root virtual environment found.
)

echo.
echo [INFO] Upgrading pip/setuptools/wheel...
call ".venv\Scripts\python.exe" -m pip install --upgrade pip setuptools wheel
if errorlevel 1 (
    echo [ERROR] Failed to upgrade Python packaging tools.
    pause
    exit /b 1
)

echo.
echo [INFO] Installing Python requirements...
call ".venv\Scripts\python.exe" -m pip install --no-cache-dir -r requirements.txt
if errorlevel 1 (
    echo [ERROR] Failed to install Python requirements.
    pause
    exit /b 1
)

echo.
echo [INFO] Installing frontend dependencies...
pushd "frontend"

if exist "package-lock.json" (
    echo [INFO] package-lock.json found. Running npm ci...
    call npm ci
) else (
    echo [INFO] package-lock.json not found. Running npm install...
    call npm install
)

if errorlevel 1 (
    echo [ERROR] Frontend dependency install failed.
    popd
    pause
    exit /b 1
)

echo.
echo [INFO] Building frontend production bundle...
call npm run build
if errorlevel 1 (
    echo [ERROR] Frontend build failed.
    popd
    pause
    exit /b 1
)
popd

echo.
echo [INFO] Verifying Python dependencies...
call ".venv\Scripts\python.exe" -c "import pydantic_core; import fastapi; print('python deps ok')"
if errorlevel 1 (
    echo [ERROR] Python dependency verification failed.
    pause
    exit /b 1
)

echo.
echo ==========================================
echo Herra Server setup complete.
echo ==========================================
echo.
echo Start the server with:
echo start_herra_server.bat
echo.
pause
exit /b 0