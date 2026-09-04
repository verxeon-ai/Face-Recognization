#!/bin/bash
echo "====================================================="
echo " AegisAI - Linux/Mac Setup Script"
echo "====================================================="

if ! command -v python3 &> /dev/null; then
    echo "[ERROR] Python 3 not found."
    exit 1
fi

echo "[1/5] Python found: $(python3 --version)"
echo "[2/5] Creating virtual environment..."
python3 -m venv venv
source venv/bin/activate

echo "[3/5] Upgrading pip..."
pip install --upgrade pip -q

echo "[4/5] Installing Python dependencies..."
pip install -r requirements.txt -q

echo "[5/5] Creating directories..."
mkdir -p dataset/known_persons data uploads results/incident_snapshots results/incident_clips

echo ""
echo " Setup Complete!"
echo " Next steps:"
echo "   1. source venv/bin/activate"
echo "   2. python dataset_setup.py   # if dataset missing"
echo "   3. python train_encodings.py # if encodings missing"
echo "   4. python app.py             # backend :5001"
echo "   5. cd frontend && npm install && npm run dev  # UI :3000"
echo "====================================================="
