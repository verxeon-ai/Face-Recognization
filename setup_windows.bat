@echo off
echo =====================================================
echo  AegisAI - Windows Setup Script
echo =====================================================
echo.

python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in PATH
    pause
    exit /b 1
)
echo [1/5] Python found.

echo [2/5] Creating virtual environment...
python -m venv venv
call venv\Scripts\activate.bat

echo [3/5] Upgrading pip...
python -m pip install --upgrade pip -q

echo [4/5] Installing dependencies...
pip install -r requirements.txt -q

echo [5/5] Creating directories...
mkdir dataset\known_persons 2>nul
mkdir data 2>nul
mkdir uploads 2>nul
mkdir results 2>nul
mkdir results\incident_snapshots 2>nul
mkdir results\incident_clips 2>nul

echo.
echo =====================================================
echo  Setup Complete!
echo =====================================================
echo  Next steps:
echo    1. python dataset_setup.py
echo    2. python train_encodings.py
echo    3. python app.py
echo    4. cd frontend ^&^& npm install ^&^& npm run dev
echo    5. Open http://localhost:3000
echo =====================================================
pause
