#!/bin/bash
echo "====================================================="
echo " Vision Security System - Linux/Mac Setup Script"
echo "====================================================="

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] Python 3 not found. Install with: sudo apt install python3 python3-pip"
    exit 1
fi

echo "[1/5] Python found: $(python3 --version)"
echo "[2/5] Creating virtual environment..."
python3 -m venv venv
source venv/bin/activate

echo "[3/5] Upgrading pip..."
pip install --upgrade pip -q

echo "[4/5] Installing dependencies from requirements.txt..."
pip install -r requirements.txt -q

echo "[5/5] Creating directories..."
mkdir -p dataset/known_persons data uploads results results/incident_snapshots

echo ""
echo "====================================================="
echo " Setup Complete!"
echo "====================================================="
echo " Next steps:"
echo "   1. source venv/bin/activate"
echo "   2. python dataset_setup.py"
echo "   3. python train_encodings.py"
echo "   4. python app.py"
echo "   5. Open: http://localhost:5000"
echo "====================================================="
