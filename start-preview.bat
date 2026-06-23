@echo off
title Sleek Stitch Atelier Business App Preview
color 0F

echo.
echo ============================================================
echo   Sleek Stitch Atelier Business App - Production Preview
echo ============================================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
  echo Node.js is not installed on this computer.
  echo Install Node.js LTS first from https://nodejs.org/
  pause
  exit /b 1
)

where npm >nul 2>nul
if %errorlevel% neq 0 (
  echo npm was not found. Reinstall Node.js LTS.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo Installing dependencies...
  call npm install
  if %errorlevel% neq 0 (
    echo Installation failed.
    pause
    exit /b 1
  )
)

if not exist "dist" (
  echo Building production app...
  call npm run build
  if %errorlevel% neq 0 (
    echo Build failed.
    pause
    exit /b 1
  )
)

echo Opening app in browser...
start "" "http://localhost:4173/"

echo Starting production preview server...
echo Keep this window open while using the app.
call npm run preview -- --host 127.0.0.1

pause
