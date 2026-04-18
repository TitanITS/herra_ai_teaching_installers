@echo off
setlocal

schtasks /End /TN "Herra Connector"

echo.
echo Task stop requested:
schtasks /Query /TN "Herra Connector"

endlocal