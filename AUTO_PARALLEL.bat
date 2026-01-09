@echo off
echo ========================================
echo   ReviewResponder - Parallel Claudes
echo ========================================
echo.

cd /d "%~dp0"

echo Starting 2 parallel Claude sessions...
echo.

REM Session 1: Testing & Bug Fixes
start "Claude - Testing" cmd /k "claude --dangerously-skip-permissions -p \"Lies MEMORY.md. Deine Aufgabe: Teste die Live-App auf https://review-responder-frontend.onrender.com - Registration, Login, Response Generation. Dokumentiere alle Bugs in MEMORY.md. Nutze WebFetch um die API zu testen.\""

REM Wait 5 seconds before starting second session
timeout /t 5 /nobreak >nul

REM Session 2: Feature Development
start "Claude - Features" cmd /k "claude --dangerously-skip-permissions -p \"Lies MEMORY.md. Deine Aufgabe: Implementiere das naechste Feature aus Phase 2 oder 3. Pushe automatisch zu GitHub wenn fertig. Update MEMORY.md.\""

echo.
echo Two Claude sessions started!
echo - Window 1: Testing ^& Bug Fixes
echo - Window 2: Feature Development
echo.
echo Both will update MEMORY.md with their progress.
pause
