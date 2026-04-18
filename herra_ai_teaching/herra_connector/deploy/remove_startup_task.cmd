@echo off
setlocal

schtasks /Delete /TN "Herra Connector" /F

echo.
echo Task removed.

endlocal