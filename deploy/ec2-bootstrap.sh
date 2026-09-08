#!/usr/bin/env bash
# Bootstrap Ubuntu 22.04/24.04 EC2 for AegisAI (Docker Compose)
set -euo pipefail

if [[ $EUID -ne 0 ]]; then
  echo "Run as root: sudo bash deploy/ec2-bootstrap.sh"
  exit 1
fi

apt-get update
apt-get install -y ca-certificates curl gnupg git

install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

. /etc/os-release
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu ${VERSION_CODENAME} stable" \
  > /etc/apt/sources.list.d/docker.list

apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

systemctl enable --now docker
usermod -aG docker ubuntu || usermod -aG docker ec2-user || true

echo "Docker installed. Log out/in (or new SSH session), then:"
echo "  cd /opt/aegisai && docker compose --env-file .env.aws up -d --build"
