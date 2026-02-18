#!/bin/bash
# UniZ Super Scaling - K3s Installation Script

echo "🚀 Installing K3s (Lightweight Kubernetes)..."

# 1. Install K3s without the default Traefik (we will use Nginx Ingress for better performance)
curl -sfL https://get.k3s.io | INSTALL_K3S_EXEC="--disable traefik" sh -

# 2. Wait for node to be ready
echo "⏳ Waiting for node to be ready..."
sleep 15
kubectl get nodes

# 3. Install Nginx Ingress Controller
echo "🕸️ Installing Nginx Ingress Controller..."
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.10.1/deploy/static/provider/cloud/deploy.yaml

# 4. Check if Metrics Server is running (required for HPA)
# K3s includes metrics-server by default, let's verify
kubectl get pods -n kube-system | grep metrics-server

echo "✅ K3s and Ingress are ready."
echo "You can now use 'kubectl' to manage your cluster."
