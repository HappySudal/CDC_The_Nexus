@echo off
chcp 65001 >nul
title The Nexus - CDC AI Governance Interface

REM ============================================================
REM The Nexus Launcher Wrapper
REM 20_Projects/CLAUDE.md §4 — Batch Wrapper Exception
REM Created: 2026-05-23 | Authority: Chairman Sudal
REM ============================================================

cd /d "%~dp0"

set "EXE_REL=Application\win-unpacked\The Nexus.exe"
set "EXE_ABS=%~dp0%EXE_REL%"

if not exist "%EXE_REL%" (
    echo.
    echo  [ERROR] The Nexus.exe not found
    echo.
    echo  Expected location:
    echo    %EXE_ABS%
    echo.
    echo  Please verify the build artifacts in Application\win-unpacked\
    echo.
    pause
    exit /b 1
)

echo.
echo  [INFO] Launching The Nexus...
echo  [PATH] %EXE_ABS%
echo.

start "The Nexus" "%EXE_REL%"

exit /b 0

REM "시각(時刻)에 존재하고, 시간(時間)에 소멸한다."
REM "Exists in the Moment, Vanishes in Time."