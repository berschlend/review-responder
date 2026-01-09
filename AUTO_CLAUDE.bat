@echo off
echo ========================================
echo   ReviewResponder - Autonomous Claude
echo ========================================
echo.

cd /d "%~dp0"

echo Starting Claude Code in YOLO mode...
echo Claude will automatically:
echo   - Test all features
echo   - Fix any bugs found
echo   - Deploy changes to GitHub
echo   - Update MEMORY.md with progress
echo.

claude --dangerously-skip-permissions -p "Lies C:\Users\Berend Mainz\Documents\Start-up\ReviewResponder\MEMORY.md und arbeite autonom an den offenen Tasks. Teste alle Features (Registration, Login, Response Generation, Payment), fixe Bugs, und pushe Aenderungen automatisch. Update MEMORY.md wenn du fertig bist. Nutze AskUserQuestion nur fuer wichtige Entscheidungen."

pause
