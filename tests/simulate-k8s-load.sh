#!/bin/bash

# --- UNIZ K8S SCALING SIMULATOR ---
# This script simulates a high-traffic event (like a result declaration)
# to trigger and verify Kubernetes Horizontal Pod Autoscaling (HPA).

# Configuration
GATEWAY_IP="10.43.220.76" # Internal Cluster IP for uniz-gateway-api
PORT="3000"
LOAD_IMAGE="busybox:1.28"
NAMESPACE="default"

echo "------------------------------------------------"
echo "🚀 UNIZ K8S DYNAMIC LOAD SIMULATOR"
echo "------------------------------------------------"
echo "This will launch multiple parallel traffic generators"
echo "inside your cluster to test the Autoscaler."
echo ""

# 1. Select Intensity
echo "Select Intensity Level:"
echo "1) LOW (Simulate ~200 Users)"
echo "2) MEDIUM (Simulate ~600 Users)"
echo "3) HIGH/WAR (Simulate 1200+ Users)"
read -p "Enter choice [1-3]: " choice

case $choice in
    1) pod_count=2 ;;
    2) pod_count=5 ;;
    3) pod_count=10 ;;
    *) pod_count=2 ;;
esac

echo "------------------------------------------------"
echo "🛠️ Starting $pod_count Load Generator Pods..."

# 2. Launch Pods via SSH (assuming the user runs this from their local machine with SSH access)
# If they are on the server, we can remove the SSH overhead, but for a general tool, we assume KUBECTL access.

for i in $(seq 1 $pod_count); do
    kubectl run "load-gen-$i" --image=$LOAD_IMAGE -n $NAMESPACE -- /bin/sh -c "while true; do wget -q -O- http://$GATEWAY_IP:$PORT/health > /dev/null; done"
done

echo "✅ Load Generators are active."
echo "------------------------------------------------"
echo "📊 MONITORING SCALE OUT (Ctrl+C to stop view)"
echo "------------------------------------------------"

# 3. Monitor scaling
count=0
while [ $count -lt 20 ]; do
    echo "$(date '+%H:%M:%S') | PODS | HPA TARGET"
    kubectl get hpa uniz-gateway-api --no-headers
    echo "------------------------------------------------"
    sleep 10
    count=$((count + 1))
done

echo ""
echo "💡 To stop the load test and scale back down, run:"
echo "   kubectl delete pods -l run -n $NAMESPACE --force --grace-period=0"
echo "------------------------------------------------"
