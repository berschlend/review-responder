@echo off
echo ============================================
echo    ReviewResponder - Quick Start Setup
echo ============================================
echo.

cd /d "%~dp0"

echo Step 1: Running setup wizard...
echo You will need your OpenAI and Stripe API keys ready.
echo.
pause

node setup.js

echo.
echo Step 2: Installing dependencies (this may take a few minutes)...
echo.
call npm install
cd backend && call npm install && cd ..
cd frontend && call npm install && cd ..

echo.
echo ============================================
echo    Setup Complete!
echo ============================================
echo.
echo To start your application:
echo    Double-click START.bat
echo.
echo Or run from command line:
echo    npm start
echo.
pause
