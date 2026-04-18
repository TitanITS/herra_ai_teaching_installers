@echo off
setlocal

cd /d "%~dp0"

set "ROOT_DIR=%~dp0"
if "%ROOT_DIR:~-1%"=="\" set "ROOT_DIR=%ROOT_DIR:~0,-1%"

set "SERVICE_DIR=%ROOT_DIR%\service"
set "SERVICE_EXE=%SERVICE_DIR%\HerraServer.exe"
set "SERVICE_XML=%SERVICE_DIR%\HerraServer.xml"
set "LAUNCHER_PS1=%ROOT_DIR%\run_herra_server.ps1"

echo ==========================================
echo Herra Server Windows Service Install
echo ==========================================
echo.

if not exist "%SERVICE_DIR%" (
    echo [ERROR] Service folder not found:
    echo %SERVICE_DIR%
    pause
    exit /b 1
)

if not exist "%SERVICE_EXE%" (
    echo [ERROR] WinSW executable not found:
    echo %SERVICE_EXE%
    echo.
    echo Place WinSW in the service folder and name it:
    echo HerraServer.exe
    pause
    exit /b 1
)

if not exist "%SERVICE_XML%" (
    echo [ERROR] WinSW XML config not found:
    echo %SERVICE_XML%
    pause
    exit /b 1
)

if not exist "%LAUNCHER_PS1%" (
    echo [ERROR] PowerShell launcher not found:
    echo %LAUNCHER_PS1%
    pause
    exit /b 1
)

echo [INFO] Installing Herra Server Windows service...
"%SERVICE_EXE%" install
if errorlevel 1 (
    echo [ERROR] Service install failed.
    pause
    exit /b 1
)

echo.
echo [INFO] Starting Herra Server Windows service...
"%SERVICE_EXE%" start
if errorlevel 1 (
    echo [ERROR] Service start failed.
    pause
    exit /b 1
)

echo.
echo ==========================================
echo Herra Server service installed successfully.
echo ==========================================
echo.
echo Service Name: Herra Server
echo Health URL:
echo http://127.0.0.1:8001/server/health
echo.
pause
exit /b 0