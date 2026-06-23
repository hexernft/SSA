@echo off
title Sleek Stitch Atelier Desktop Dev
color 0F

echo.
echo Starting Sleek Stitch Atelier desktop app in development mode...
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
  echo Node.js is not installed.
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

call npm run desktop:dev
pause
