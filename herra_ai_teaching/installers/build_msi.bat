@echo off
setlocal

cd /d "%~dp0"

for %%I in ("C:\Program Files (x86)\WiX Toolset v3.14\bin") do set "WIX_BIN=%%~fsI"
set "CANDLE=%WIX_BIN%\candle.exe"
set "LIGHT=%WIX_BIN%\light.exe"

echo ==========================================
echo Herra AI Teaching Server MSI Build
echo ==========================================
echo.

echo [INFO] WiX bin path:
echo %WIX_BIN%
echo.

if not exist "%CANDLE%" goto missing_candle
if not exist "%LIGHT%" goto missing_light
if not exist "..\service\HerraServer.exe" goto missing_service_exe
if not exist "..\service\HerraServer.xml" goto missing_service_xml
if not exist "..\run_herra_server.ps1" goto missing_launcher
if not exist "..\backend\server_app.py" goto missing_server_app
if not exist "..\frontend\dist\index.html" goto missing_frontend_build

echo [INFO] Compiling WiX source...
"%CANDLE%" -arch x64 -out HerraServer.wixobj HerraServer.wxs
if errorlevel 1 goto candle_failed

echo.
echo [INFO] Linking MSI package...
"%LIGHT%" -out HerraAITeachingServer.msi HerraServer.wixobj
if errorlevel 1 goto light_failed

echo.
echo ==========================================
echo MSI build completed successfully.
echo ==========================================
echo Output:
echo %cd%\HerraAITeachingServer.msi
echo.
pause
exit /b 0

:missing_candle
echo [ERROR] candle.exe was not found at:
echo %CANDLE%
pause
exit /b 1

:missing_light
echo [ERROR] light.exe was not found at:
echo %LIGHT%
pause
exit /b 1

:missing_service_exe
echo [ERROR] Missing service wrapper:
echo ..\service\HerraServer.exe
pause
exit /b 1

:missing_service_xml
echo [ERROR] Missing service config:
echo ..\service\HerraServer.xml
pause
exit /b 1

:missing_launcher
echo [ERROR] Missing PowerShell launcher:
echo ..\run_herra_server.ps1
pause
exit /b 1

:missing_server_app
echo [ERROR] Missing backend server entrypoint:
echo ..\backend\server_app.py
pause
exit /b 1

:missing_frontend_build
echo [ERROR] Frontend build output not found.
echo Build the frontend first before creating the MSI.
echo Expected:
echo ..\frontend\dist\index.html
pause
exit /b 1

:candle_failed
echo [ERROR] candle.exe compile failed.
pause
exit /b 1

:light_failed
echo [ERROR] light.exe link failed.
pause
exit /b 1