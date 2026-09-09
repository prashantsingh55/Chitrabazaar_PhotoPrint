#!/bin/bash
set -e

echo "=== 1. Update OS & Install Docker ==="
sudo apt-get update && sudo apt-get upgrade -y
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker ubuntu

echo "=== 2. Configure Firewall (UFW) ==="
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 443/udp # HTTP/3 QUIC
sudo ufw --force enable

echo "=== 3. Setup Project Directory & Start Stack ==="
mkdir -p /home/ubuntu/chitrabazaar
cd /home/ubuntu/chitrabazaar
# Place docker-compose.prod.yml, Caddyfile, and .env in this folder
docker compose -f docker-compose.prod.yml up -d

echo "=== Chitrabazaar Production Stack Live! ==="
docker compose ps
