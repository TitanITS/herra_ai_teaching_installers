@echo off
setlocal EnableExtensions EnableDelayedExpansion

cd /d "%~dp0"

set "WIX_BIN=C:\Program Files (x86)\WiX Toolset v3.14\bin"
set "CANDLE=%WIX_BIN%\candle.exe"
set "LIGHT=%WIX_BIN%\light.exe"
set "HEAT=%WIX_BIN%\heat.exe"

set "PROJECT_ROOT=%~dp0.."
for %%I in ("%PROJECT_ROOT%") do set "PROJECT_ROOT=%%~fI"

set "BACKEND_SOURCE_DIR=%PROJECT_ROOT%\backend"
set "FRONTEND_DIST_SOURCE_DIR=%PROJECT_ROOT%\frontend\dist"
set "VENV_SOURCE_DIR=%PROJECT_ROOT%\.venv"
set "SERVICE_EXE=%PROJECT_ROOT%\service\HerraServer.exe"
set "SERVICE_XML=%PROJECT_ROOT%\service\HerraServer.xml"
set "RUNNER_PS1=%PROJECT_ROOT%\run_herra_server.ps1"
set "DEPLOYMENT_BOOTSTRAP_JSON=%PROJECT_ROOT%\deployment_bootstrap.json"
set "START_BAT=%PROJECT_ROOT%\start_herra_server.bat"
set "INSTALL_SERVER_BAT=%PROJECT_ROOT%\install_herra_server_windows.bat"
set "INSTALL_SERVICE_BAT=%PROJECT_ROOT%\install_herra_service_windows.bat"
set "REMOVE_SERVICE_BAT=%PROJECT_ROOT%\remove_herra_service_windows.bat"
set "REQUIREMENTS_TXT=%PROJECT_ROOT%\requirements.txt"
set "README_MD=%PROJECT_ROOT%\README.md"

set "BUILD_ROOT=%CD%\build"
set "OBJ_DIR=%BUILD_ROOT%\obj"
set "OUTPUT_DIR=%BUILD_ROOT%\output"
set "OUTPUT_MSI=%OUTPUT_DIR%\HerraAITeachingServer.msi"
set "BACKEND_WXS=%OBJ_DIR%\BackendFiles.wxs"
set "FRONTEND_WXS=%OBJ_DIR%\FrontendDistFiles.wxs"
set "VENV_WXS=%OBJ_DIR%\VenvFiles.wxs"

echo ==========================================
echo Herra AI Teaching Server MSI Build
echo ==========================================
echo.
echo [INFO] Project root:
echo %PROJECT_ROOT%
echo.

if not exist "%CANDLE%" goto missing_candle
if not exist "%LIGHT%" goto missing_light
if not exist "%HEAT%" goto missing_heat
if not exist "%BACKEND_SOURCE_DIR%\server_app.py" goto missing_backend
if not exist "%FRONTEND_DIST_SOURCE_DIR%\index.html" goto missing_frontend_dist
if not exist "%VENV_SOURCE_DIR%\Scripts\python.exe" goto missing_venv
if not exist "%SERVICE_EXE%" goto missing_service_exe
if not exist "%SERVICE_XML%" goto missing_service_xml
if not exist "%RUNNER_PS1%" goto missing_runner
if not exist "%DEPLOYMENT_BOOTSTRAP_JSON%" goto missing_bootstrap_json
if not exist "%START_BAT%" goto missing_start_bat
if not exist "%INSTALL_SERVER_BAT%" goto missing_install_server_bat
if not exist "%INSTALL_SERVICE_BAT%" goto missing_install_service_bat
if not exist "%REMOVE_SERVICE_BAT%" goto missing_remove_service_bat
if not exist "%REQUIREMENTS_TXT%" goto missing_requirements
if not exist "%README_MD%" goto missing_readme
if not exist "%CD%\HerraServer.wxs" goto missing_product_wxs

echo [INFO] Resetting build folders...
if exist "%BUILD_ROOT%" rmdir /s /q "%BUILD_ROOT%"
mkdir "%OBJ_DIR%" >nul 2>&1
if errorlevel 1 goto mkdir_failed
mkdir "%OUTPUT_DIR%" >nul 2>&1
if errorlevel 1 goto mkdir_failed

echo.
echo [INFO] Harvesting backend files...
"%HEAT%" dir "%BACKEND_SOURCE_DIR%" -nologo -ag -cg CG_Backend -dr BACKENDDIR -scom -sreg -sfrag -srd -var var.BackendSourceDir -out "%BACKEND_WXS%"
if errorlevel 1 goto heat_backend_failed

echo.
echo [INFO] Harvesting frontend dist files...
"%HEAT%" dir "%FRONTEND_DIST_SOURCE_DIR%" -nologo -ag -cg CG_FrontendDist -dr FRONTENDDISTDIR -scom -sreg -sfrag -srd -var var.FrontendDistSourceDir -out "%FRONTEND_WXS%"
if errorlevel 1 goto heat_frontend_failed

echo.
echo [INFO] Harvesting embedded Python runtime files...
"%HEAT%" dir "%VENV_SOURCE_DIR%" -nologo -ag -cg CG_Venv -dr VENVROOTDIR -scom -sreg -sfrag -srd -var var.VenvSourceDir -out "%VENV_WXS%"
if errorlevel 1 goto heat_venv_failed

echo.
echo [INFO] Compiling WiX sources...
"%CANDLE%" -nologo -arch x64 -dBackendSourceDir="%BACKEND_SOURCE_DIR%" -dFrontendDistSourceDir="%FRONTEND_DIST_SOURCE_DIR%" -dVenvSourceDir="%VENV_SOURCE_DIR%" -out "%OBJ_DIR%\\" "%CD%\HerraServer.wxs" "%BACKEND_WXS%" "%FRONTEND_WXS%" "%VENV_WXS%"
if errorlevel 1 goto candle_failed

echo.
echo [INFO] Linking MSI package...
"%LIGHT%" -nologo -out "%OUTPUT_MSI%" "%OBJ_DIR%\HerraServer.wixobj" "%OBJ_DIR%\BackendFiles.wixobj" "%OBJ_DIR%\FrontendDistFiles.wixobj" "%OBJ_DIR%\VenvFiles.wixobj"
if errorlevel 1 goto light_failed

echo.
echo ==========================================
echo MSI build completed successfully.
echo ==========================================
echo Output:
echo %OUTPUT_MSI%
echo.
exit /b 0

:missing_candle
echo [ERROR] candle.exe was not found at:
echo %CANDLE%
exit /b 1

:missing_light
echo [ERROR] light.exe was not found at:
echo %LIGHT%
exit /b 1

:missing_heat
echo [ERROR] heat.exe was not found at:
echo %HEAT%
exit /b 1

:missing_backend
echo [ERROR] Missing backend source directory entrypoint:
echo %BACKEND_SOURCE_DIR%\server_app.py
exit /b 1

:missing_frontend_dist
echo [ERROR] Missing frontend dist build output:
echo %FRONTEND_DIST_SOURCE_DIR%\index.html
exit /b 1

:missing_venv
echo [ERROR] Missing embedded Python runtime:
echo %VENV_SOURCE_DIR%\Scripts\python.exe
exit /b 1

:missing_service_exe
echo [ERROR] Missing WinSW executable:
echo %SERVICE_EXE%
exit /b 1

:missing_service_xml
echo [ERROR] Missing WinSW XML configuration:
echo %SERVICE_XML%
exit /b 1

:missing_runner
echo [ERROR] Missing PowerShell runner:
echo %RUNNER_PS1%
exit /b 1

:missing_bootstrap_json
echo [ERROR] Missing deployment bootstrap JSON:
echo %DEPLOYMENT_BOOTSTRAP_JSON%
exit /b 1

:missing_start_bat
echo [ERROR] Missing launcher batch file:
echo %START_BAT%
exit /b 1

:missing_install_server_bat
echo [ERROR] Missing installer helper batch file:
echo %INSTALL_SERVER_BAT%
exit /b 1

:missing_install_service_bat
echo [ERROR] Missing service install helper batch file:
echo %INSTALL_SERVICE_BAT%
exit /b 1

:missing_remove_service_bat
echo [ERROR] Missing service removal helper batch file:
echo %REMOVE_SERVICE_BAT%
exit /b 1

:missing_requirements
echo [ERROR] Missing root requirements file:
echo %REQUIREMENTS_TXT%
exit /b 1

:missing_readme
echo [ERROR] Missing README file:
echo %README_MD%
exit /b 1

:missing_product_wxs
echo [ERROR] Missing WiX product source:
echo %CD%\HerraServer.wxs
exit /b 1

:mkdir_failed
echo [ERROR] Failed to create build directories under:
echo %BUILD_ROOT%
exit /b 1

:heat_backend_failed
echo [ERROR] Heat harvest failed for backend.
exit /b 1

:heat_frontend_failed
echo [ERROR] Heat harvest failed for frontend dist.
exit /b 1

:heat_venv_failed
echo [ERROR] Heat harvest failed for embedded Python runtime.
exit /b 1

:candle_failed
echo [ERROR] candle.exe compile failed.
exit /b 1

:light_failed
echo [ERROR] light.exe link failed.
exit /b 1