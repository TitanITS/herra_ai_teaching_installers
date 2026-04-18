@echo off
setlocal

schtasks /Run /TN "Herra Connector"

echo.
echo Task start requested:
schtasks /Query /TN "Herra Connector"

endlocal