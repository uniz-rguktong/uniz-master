#!/bin/bash
set -e

echo "🚀 Welcome to the UniZ Zero-to-Production Demonstration Simulator!"
echo "This script automates Phase 2 and Phase 3 of the infrastructure deployment."
echo "Prerequisite (Phase 1): You must have ALREADY wiped the Hostinger VPS to a blank Ubuntu 24.04 OS."
echo ""
read -p "Press ENTER to begin bootstrapping the core infrastructure on 76.13.241.174, or CTRL+C to cancel..."

echo -e "\n=========================================="
echo " PHASE 2: Bootstrapping Core Dependencies "
echo "=========================================="

ssh -o StrictHostKeyChecking=no root@76.13.241.174 << 'EOF'
  set -e
  echo ">>> Updating OS and installing network utilities..."
  apt update && apt upgrade -y
  apt install -y curl wget git ufw nginx certbot python3-certbot-nginx

  echo ">>> Configuring UFW Firewall..."
  ufw allow OpenSSH
  ufw allow "Nginx Full"
  ufw allow 8080/tcp
  # Skipping actual UFW enable to prevent accidental lockout, but it's prepped.

  echo ">>> Installing Docker Container Engine..."
  if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
  else
    echo "[-] Docker is already installed."
  fi

  echo ">>> Installing K3s (Lightweight Kubernetes by Rancher)..."
  if ! command -v k3s &> /dev/null; then
    curl -sfL https://get.k3s.io | sh -
  else
    echo "[-] K3s is already installed."
  fi
  
  echo ">>> Cloning UniZ Master Repository..."
  cd /root
  if [ -d "uniz-master/.git" ]; then
    echo "[-] Repository mapping found, pulling latest..."
    cd uniz-master
    git fetch origin main
    git reset --hard origin/main
  else
    rm -rf uniz-master  # Clean if it's an empty dir
    git clone https://github.com/uniz-rguktong/uniz-master.git
    cd uniz-master
  fi

  echo ">>> Applying Initial Kubernetes Infrastructure Manifests..."
  export KUBECONFIG=/etc/rancher/k3s/k3s.yaml
  kubectl apply -k infra/core-infra/kubernetes/base
EOF

echo -e "\n=========================================="
echo " PHASE 3: Deploying UniZ Microservices    "
echo "=========================================="
echo ">>> Triggering automated multi-container deployment pipeline..."
echo "This routine will build native Docker images directly on the VPS, inject them into K3s, and dynamically scale the pods."
echo ""

# Hand off execution directly to the existing robust deployment script
bash ./scripts/deploy.sh

echo -e "\n🎉 Zero-to-Production Setup Complete!"
echo "You can now run 'npm run attack' and 'npm run watch' in separate terminals to show Phase 4 (Auto-Scaler Demonstration)."
