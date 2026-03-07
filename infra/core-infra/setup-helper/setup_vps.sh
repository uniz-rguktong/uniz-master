#!/bin/bash
# VPS Setup Script for High Concurrency (Ubuntu 24.04)
set -e

echo "=== 1. System Updates & Dependencies ==="
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git unzip build-essential nginx redis-server

# Install Node.js (Latest LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 globally
sudo npm install -g pm2 typescript ts-node

echo "=== 2. Tuning Kernel for High Concurrency ==="
# Allow opening many files (socket connections are files in Linux)
echo "* soft nofile 65535" | sudo tee -a /etc/security/limits.conf
echo "* hard nofile 65535" | sudo tee -a /etc/security/limits.conf

# Tune sysctl for networking
sudo tee -a /etc/sysctl.conf <<EOF
# Increase max open files
fs.file-max = 65535
# Increase backlog for incoming connections
net.core.somaxconn = 4096
# Enable TCP reuse (useful for many short lived connections)
net.ipv4.tcp_tw_reuse = 1
# Increase port range
net.ipv4.ip_local_port_range = 1024 65535
EOF

sudo sysctl -p

echo "=== 3. Firewall Setup ==="
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable

echo "=== 4. Setup Completed ==="
echo "Please clone your repo, copy .env files, and run:"
echo "pm2 start deploy_config/ecosystem.config.js"
