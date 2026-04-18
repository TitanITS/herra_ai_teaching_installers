@echo off
setlocal

cd /d "%~dp0"

set "ROOT_DIR=%~dp0"
if "%ROOT_DIR:~-1%"=="\" set "ROOT_DIR=%ROOT_DIR:~0,-1%"

set "SERVICE_DIR=%ROOT_DIR%\service"
set "SERVICE_EXE=%SERVICE_DIR%\HerraServer.exe"

echo ==========================================
echo Herra Server Windows Service Removal
echo ==========================================
echo.

if not exist "%SERVICE_EXE%" (
    echo [ERROR] WinSW executable not found:
    echo %SERVICE_EXE%
    pause
    exit /b 1
)

echo [INFO] Stopping Herra Server Windows service...
"%SERVICE_EXE%" stop

echo.
echo [INFO] Removing Herra Server Windows service...
"%SERVICE_EXE%" uninstall
if errorlevel 1 (
    echo [ERROR] Service uninstall failed.
    pause
    exit /b 1
)

echo.
echo ==========================================
echo Herra Server service removed successfully.
echo ==========================================
echo.
pause
exit /b 0REM FILE: herra_ai_teaching\remove_herra_service_windows.bat
@echo off
setlocal EnableExtensions

cd /d "%~dp0"

set "ROOT_DIR=%~dp0"
if "%ROOT_DIR:~-1%"=="\" set "ROOT_DIR=%ROOT_DIR:~0,-1%"

set "SERVICE_DIR=%ROOT_DIR%\service"
set "SERVICE_EXE=%SERVICE_DIR%\HerraServer.exe"

echo ==========================================
echo Herra Server Windows Service Removal
echo ==========================================
echo.

if not exist "%SERVICE_EXE%" (
    echo [ERROR] WinSW executable not found:
    echo %SERVICE_EXE%
    exit /b 1
)

sc query "HerraServer" >nul 2>&1
if errorlevel 1 (
    echo [INFO] Service HerraServer is not installed.
    exit /b 0
)

echo [INFO] Stopping Herra Server Windows service...
"%SERVICE_EXE%" stop >nul 2>&1

echo.
echo [INFO] Removing Herra Server Windows service...
"%SERVICE_EXE%" uninstall
if errorlevel 1 (
    echo [ERROR] Service uninstall failed.
    exit /b 1
)

echo.
echo ==========================================
echo Herra Server service removed successfully.
echo ==========================================
echo.
exit /b 0