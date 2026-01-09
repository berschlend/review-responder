@echo off
echo ============================================
echo    ReviewResponder - Marketing Tool
echo ============================================
echo.

cd /d "%~dp0"

echo Starte Lead Finder...
echo.

python find_leads.py

pause
