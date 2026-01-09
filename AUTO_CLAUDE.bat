@echo off
echo ========================================
echo   ReviewResponder - Autonomous Claude
echo ========================================
echo.

cd /d "C:\Users\Berend Mainz\Documents\Start-up\ReviewResponder"

echo Starting Claude Code in YOLO mode...
echo Claude will automatically:
echo   - Test all features
echo   - Fix any bugs found
echo   - Deploy changes to GitHub
echo   - Update MEMORY.md with progress
echo.
echo Starte Claude...
echo.

claude --dangerously-skip-permissions

pause
