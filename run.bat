@echo off
title Pipeline Automatizado de Shorts
cd /d "%~dp0"

if exist ".\venv\Scripts\activate.bat" (
    call .\venv\Scripts\activate.bat
)

python pipeline.py

pause