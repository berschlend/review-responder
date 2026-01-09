@echo off
echo ============================================
echo    ReviewResponder - Starting Application
echo ============================================
echo.

cd /d "%~dp0"

echo Checking if dependencies are installed...
if not exist "node_modules" (
    echo Installing root dependencies...
    call npm install
)

if not exist "backend\node_modules" (
    echo Installing backend dependencies...
    cd backend
    call npm install
    cd ..
)

if not exist "frontend\node_modules" (
    echo Installing frontend dependencies...
    cd frontend
    call npm install
    cd ..
)

echo.
echo Starting ReviewResponder...
echo.
echo Backend will run on: http://localhost:5000
echo Frontend will run on: http://localhost:3000
echo.
echo Press Ctrl+C to stop the application.
echo.

npm start
