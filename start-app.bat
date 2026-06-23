@echo off
title Sleek Stitch Atelier Business App
color 0F

echo.
echo ============================================================
echo   Sleek Stitch Atelier Business App
echo ============================================================
echo.
echo Starting offline business app...
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
  echo Node.js is not installed on this computer.
  echo.
  echo Please install Node.js LTS first, then run this file again.
  echo Download Node.js from:
  echo https://nodejs.org/
  echo.
  pause
  exit /b 1
)

where npm >nul 2>nul
if %errorlevel% neq 0 (
  echo npm was not found on this computer.
  echo.
  echo Please reinstall Node.js LTS and make sure npm is included.
  echo.
  pause
  exit /b 1
)

if not exist "package.json" (
  echo package.json was not found.
  echo.
  echo Make sure this file is inside the main app folder.
  echo.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo First-time setup detected.
  echo Installing app dependencies...
  echo.
  call npm install
  if %errorlevel% neq 0 (
    echo.
    echo Dependency installation failed.
    echo Please check your internet connection and try again.
    echo.
    pause
    exit /b 1
  )
)

echo.
echo Opening app in browser...
start "" "http://localhost:5173/"

echo.
echo Starting local app server...
echo.
echo Keep this window open while using the app.
echo Close this window when you are done.
echo.
call npm run dev

pause
