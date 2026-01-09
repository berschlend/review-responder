@echo off
echo ============================================
echo    ReviewResponder - AUTO MARKETING
echo ============================================
echo.
echo Dieses Tool generiert automatisch:
echo   - SEO Blog Posts
echo   - Social Media Content
echo   - Email Templates
echo.
echo Du musst nur noch copy-paste machen!
echo.

cd /d "%~dp0"

echo Installiere Python Pakete falls noetig...
pip install openai >nul 2>&1

echo.
echo Starte Content Generator...
echo.

python auto_content_generator.py

pause
