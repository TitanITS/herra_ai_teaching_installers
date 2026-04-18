@echo off
setlocal

set TASK_NAME=Herra Connector

schtasks /Query /TN "%TASK_NAME%" >nul 2>&1
if %errorlevel%==0 (
    schtasks /Delete /TN "%TASK_NAME%" /F
)

schtasks /Create ^
 /TN "%TASK_NAME%" ^
 /SC ONSTART ^
 /RU SYSTEM ^
 /RL HIGHEST ^
 /TR "cmd.exe /c C:\Herra_Connector\deploy\start_herra_connector.cmd" ^
 /F

echo.
echo Task installed:
schtasks /Query /TN "%TASK_NAME%"

endlocal