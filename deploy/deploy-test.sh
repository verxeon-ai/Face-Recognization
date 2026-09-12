#!/usr/bin/env bash
# One-command EC2 bootstrap for AegisAI client test
# Usage: sudo bash deploy/deploy-test.sh
set -euo pipefail

if [[ $EUID -ne 0 ]]; then
  echo "Run as root: sudo bash deploy/deploy-test.sh"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "=========================================="
echo "  AegisAI Client Test — EC2 Setup"
echo "=========================================="

# 1. Install Docker
echo ""
echo "[1/4] Installing Docker..."
apt-get update -qq
apt-get install -y -qq ca-certificates curl gnupg git > /dev/null 2>&1

install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

. /etc/os-release
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu ${VERSION_CODENAME} stable" \
  > /etc/apt/sources.list.d/docker.list

apt-get update -qq
apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-compose-plugin > /dev/null 2>&1
systemctl enable --now docker
echo "  + Docker installed"

# 2. Create .env.test if not exists
echo ""
echo "[2/4] Configuring environment..."
if [[ ! -f "$PROJECT_DIR/.env.test" ]]; then
  SECRET=$(head -c 32 /dev/urandom | base64 | tr -dc 'a-zA-Z0-9' | head -c 32)
  cp "$PROJECT_DIR/deploy/env.test.example" "$PROJECT_DIR/.env.test"
  sed -i "s/replace-with-long-random-string/$SECRET/" "$PROJECT_DIR/.env.test"
  sed -i "s/replace-me/admin123/" "$PROJECT_DIR/.env.test"
  # Second replace-me (OPERATOR_PASSWORD)
  sed -i "0,/replace-me/{s/replace-me/operator123/}" "$PROJECT_DIR/.env.test"
  echo "  + Created .env.test with generated secrets"
else
  echo "  + .env.test already exists, keeping it"
fi

# 3. Build and start
echo ""
echo "[3/4] Building containers (first time takes 10-15 min)..."
cd "$PROJECT_DIR"
docker compose -f deploy/docker-compose.test.yml --env-file .env.test up -d --build

# 4. Print access info
echo ""
echo "[4/4] Verifying..."
sleep 5
if curl -fsS http://127.0.0.1/api/health > /dev/null 2>&1; then
  echo "  + Backend healthy"
else
  echo "  ! Backend still starting (may take 30-60s for first boot)"
fi

PUBLIC_IP=$(curl -s http://checkip.amazonaws.com 2>/dev/null || echo "YOUR_EC2_PUBLIC_IP")

echo ""
echo "=========================================="
echo "  AegisAI Client Test — Ready!"
echo "=========================================="
echo ""
echo "  Open: http://$PUBLIC_IP"
echo ""
echo "  Default passwords:"
echo "    Admin:     admin123"
echo "    Operator:  operator123"
echo ""
echo "  Features:"
echo "    - Image upload & face recognition"
echo "    - Video scan (frame-by-frame analysis)"
echo "    - Identity enrollment (add person)"
echo ""
echo "  Management:"
echo "    docker compose -f deploy/docker-compose.test.yml logs -f backend"
echo "    docker compose -f deploy/docker-compose.test.yml down"
echo "    docker compose -f deploy/docker-compose.test.yml up -d"
echo "=========================================="
