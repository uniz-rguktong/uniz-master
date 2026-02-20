#!/bin/bash

# --- UNIZ K8S CLEANUP TOOL ---
# Clears all stress test pods and returns cluster to idle state.

echo "------------------------------------------------"
echo "🧹 STOPPING ALL LOAD GENERATORS"
echo "------------------------------------------------"

# Find and delete all pods created with 'kubectl run' pattern
kubectl delete pods --selector=run -n default --force --grace-period=0

echo ""
echo "✅ All Load Generators Stopped."
echo "📉 Kubernetes will now begin scaling back to MIN_REPLICAS."
echo "------------------------------------------------"
