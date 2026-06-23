@echo off
title Build Sleek Stitch Atelier Portable EXE
color 0F

echo.
echo ============================================================
echo   Build Portable Sleek Stitch Atelier EXE
echo ============================================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
  echo Node.js is not installed.
  echo Install Node.js LTS from https://nodejs.org/ and run this file again.
  pause
  exit /b 1
)

if not exist "package.json" (
  echo package.json was not found.
  echo Make sure this file is inside the main app folder.
  pause
  exit /b 1
)

call npm install
if %errorlevel% neq 0 (
  echo npm install failed.
  pause
  exit /b 1
)

call npm run desktop:build:portable
if %errorlevel% neq 0 (
  echo Portable EXE build failed.
  pause
  exit /b 1
)

explorer release
pause
