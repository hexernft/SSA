@echo off
title Build Sleek Stitch Atelier EXE
color 0F

echo.
echo ============================================================
echo   Build Sleek Stitch Atelier Business App EXE
echo ============================================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
  echo Node.js is not installed on this computer.
  echo Install Node.js LTS from https://nodejs.org/ and run this file again.
  echo.
  pause
  exit /b 1
)

where npm >nul 2>nul
if %errorlevel% neq 0 (
  echo npm was not found.
  echo Reinstall Node.js LTS and make sure npm is included.
  echo.
  pause
  exit /b 1
)

if not exist "package.json" (
  echo package.json was not found.
  echo Make sure this file is inside the main app folder.
  echo.
  pause
  exit /b 1
)

echo Installing dependencies...
echo This can take a few minutes on the first run.
echo.
call npm install
if %errorlevel% neq 0 (
  echo.
  echo npm install failed.
  echo Check your internet connection and try again.
  echo.
  pause
  exit /b 1
)

echo.
echo Building Windows installer and portable EXE...
echo.
call npm run desktop:build
if %errorlevel% neq 0 (
  echo.
  echo EXE build failed.
  echo Check the error message above.
  echo.
  pause
  exit /b 1
)

echo.
echo ============================================================
echo   Build complete!
echo ============================================================
echo.
echo Your installer and portable EXE files should be inside:
echo release
echo.
explorer release
pause
