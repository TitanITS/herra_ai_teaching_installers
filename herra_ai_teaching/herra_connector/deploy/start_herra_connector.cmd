@echo off
setlocal

cd /d C:\Herra_Connector

if not exist C:\Herra_Connector\logs mkdir C:\Herra_Connector\logs

call C:\Herra_Connector\deploy\connector.env.cmd
call C:\Herra_Connector\.venv\Scripts\activate.bat

echo [%date% %time%] Starting Herra Connector...>> C:\Herra_Connector\logs\connector_launcher.log
python .\src\main.py >> C:\Herra_Connector\logs\connector_runtime.log 2>&1
echo [%date% %time%] Herra Connector exited with errorlevel %errorlevel% >> C:\Herra_Connector\logs\connector_launcher.log

endlocal