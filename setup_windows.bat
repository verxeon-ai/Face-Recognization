@echo off
echo =====================================================
echo  Vision Security System - Windows Setup Script
echo =====================================================
echo.

:: Check Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in PATH
    echo Install Python 3.10+ from https://www.python.org/downloads/
    pause
    exit /b 1
)
echo [1/5] Python found.

:: Create virtual environment
echo [2/5] Creating virtual environment...
python -m venv venv
call venv\Scripts\activate.bat

:: Upgrade pip
echo [3/5] Upgrading pip...
python -m pip install --upgrade pip -q

:: Install requirements
echo [4/5] Installing dependencies from requirements.txt...
pip install -r requirements.txt -q

echo [5/5] Creating required directories...
mkdir dataset\known_persons 2>nul
mkdir data 2>nul
mkdir uploads 2>nul
mkdir results 2>nul
mkdir results\incident_snapshots 2>nul

echo.
echo =====================================================
echo  Setup Complete!
echo =====================================================
echo  Next steps:
echo    1. Run: python dataset_setup.py
echo    2. Run: python train_encodings.py
echo    3. Run: python app.py
echo    4. Open: http://localhost:5000
echo =====================================================
pause
