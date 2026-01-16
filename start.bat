@echo off
chcp 65001 >nul
echo ========================================
echo   Starting Life Destiny K-Line App
echo ========================================
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    echo.
)

REM Start the development server
echo Starting development server...
echo.
call npm run dev

pause
