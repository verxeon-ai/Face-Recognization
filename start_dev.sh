#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
export PATH="${HOME}/.local/node/bin:${PATH}"

echo "Starting Flask backend on :5001 (+ HTTPS proxy :5443)..."
cd "$ROOT"
if [[ -f venv/bin/activate ]]; then
  # shellcheck disable=SC1091
  source venv/bin/activate
fi
python app.py &
BACKEND_PID=$!

cleanup() {
  kill "$BACKEND_PID" 2>/dev/null || true
}
trap cleanup EXIT

sleep 2
echo "Starting Next.js UI on :3000..."
cd "$ROOT/frontend"
npm run dev
