#!/bin/bash

# --- UNIZ WAR ROOM: PRODUCTION LOAD TESTING TOOL ---
# Designed for: 76.13.241.174 (Production VPS)
# Purpose: Professional Stress Testing & Autoscaling Verification

# Colors for Professional UI
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Configuration
GATEWAY_URL="http://uniz-gateway-api.default.svc.cluster.local:3000/health"
LOAD_IMAGE="busybox:1.28"
NAME_PREFIX="war-room-bot"

function banner() {
    clear
    echo -e "${PURPLE}${BOLD}"
    echo "  ██╗   ██╗███╗   ██╗██╗███████╗  ██╗    ██╗ █████╗ ██████╗ "
    echo "  ██║   ██║████╗  ██║██║╚══███╔╝  ██║    ██║██╔══██╗██╔══██╗"
    echo "  ██║   ██║██╔██╗ ██║██║  ███╔╝   ██║ █╗ ██║███████║██████╔╝"
    echo "  ██║   ██║██║╚██╗██║██║ ███╔╝    ██║███╗██║██╔══██║██╔══██╗"
    echo "  ╚██████╔╝██║ ╚████║██║███████╗  ╚███╔███╔╝██║  ██║██║  ██║"
    echo "   ╚═════╝ ╚═╝  ╚═══╝╚═╝╚══════╝   ╚══╝╚══╝ ╚═╝  ╚═╝╚═╝  ╚═╝"
    echo -e "                   SYSTEM STRESS TESTER v2.0${NC}"
    echo -e "${CYAN}----------------------------------------------------------------${NC}"
}

function show_menu() {
    echo -e "${BOLD}SELECT SCENARIO:${NC}"
    echo -e "1) ${GREEN}LITE BURST${NC}    - 2 Load Pods (~200 Simultaneous Requests)"
    echo -e "2) ${YELLOW}HEAVY TRAFFIC${NC} - 5 Load Pods (~600 Simultaneous Requests)"
    echo -e "3) ${RED}${BOLD}WAR / CRISIS${NC}  - 12 Load Pods (1,200+ Requests - Full Scale-out)"
    echo -e "4) ${CYAN}CLEANUP${NC}       - Terminate all test pods and restore idle state"
    echo -e "5) ${NC}EXIT${NC}"
    echo -e "${CYAN}----------------------------------------------------------------${NC}"
    read -p "Battle Choice [1-5]: " choice
}

function stop_test() {
    echo -e "\n${YELLOW}⚠️  Terminating War-Room Bots...${NC}"
    kubectl delete pods -l category=load-test --force --grace-period=0 > /dev/null 2>&1
    echo -e "${GREEN}✅ System Restored to Idle State.${NC}"
}

function run_test() {
    local count=$1
    local mode=$2
    
    echo -e "${BLUE}🚀 Deploying ${count} Battle Bots in ${mode} Mode...${NC}"
    
    for i in $(seq 1 $count); do
        kubectl run "${NAME_PREFIX}-$i" \
            --image=$LOAD_IMAGE \
            --labels="category=load-test,bot-id=$i" \
            --restart=Never \
            -- /bin/sh -c "while true; do wget -q -O- $GATEWAY_URL > /dev/null; done" > /dev/null 2>&1
    done

    echo -e "${GREEN}✅ Deployment Complete. Entering Observation Deck...${NC}"
    echo -e "${CYAN}Press Ctrl+C to stop monitoring and return to menu.${NC}"
    
    # Live Dashboard Loop
    while true; do
        clear
        banner
        echo -e "${BOLD}MODE:${NC} $mode | ${BOLD}BOTS:${NC} $count"
        echo -e "${CYAN}----------------------------------------------------------------${NC}"
        echo -e "${BOLD}SERVICE POD STATUS:${NC}"
        printf "%-25s %-10s %-10s\n" "DEPLOYMENT" "REPLICAS" "CPU AVG"
        
        # Get Gateway Stats
        gw_repl=$(kubectl get deployment uniz-gateway-api -o jsonpath='{.status.readyReplicas}')
        gw_cpu=$(kubectl top pods -l app=uniz-gateway-api --no-headers 2>/dev/null | awk '{sum+=$2} END {print sum}')
        [ -z "$gw_repl" ] && gw_repl=0
        [ -z "$gw_cpu" ] && gw_cpu=0
        printf "%-25s %-10s %-10s\n" "uniz-gateway-api" "$gw_repl/15" "${gw_cpu}m"

        # Get User Stats
        u_repl=$(kubectl get deployment uniz-user-service -o jsonpath='{.status.readyReplicas}')
        u_cpu=$(kubectl top pods -l app=uniz-user-service --no-headers 2>/dev/null | awk '{sum+=$2} END {print sum}')
        [ -z "$u_repl" ] && u_repl=0
        [ -z "$u_cpu" ] && u_cpu=0
        printf "%-25s %-10s %-10s\n" "uniz-user-service" "$u_repl/10" "${u_cpu}m"

        echo -e "${CYAN}----------------------------------------------------------------${NC}"
        echo -e "${BOLD}HPA LIVE TARGETS:${NC}"
        kubectl get hpa uniz-gateway-api --no-headers 2>/dev/null | awk '{print "Gateway: " $3 " | Replicas: " $6}'
        kubectl get hpa uniz-user-service --no-headers 2>/dev/null | awk '{print "Profile: " $3 " | Replicas: " $6}'
        echo -e "${CYAN}----------------------------------------------------------------${NC}"
        
        sleep 5
    done
}

# Trap Ctrl+C to stop the monitoring loop but NOT the bots (let user decide in menu)
trap "echo -e '\nReturn to menu...'; break" SIGINT

while true; do
    banner
    show_menu
    case $choice in
        1) run_test 2 "LITE" ;;
        2) run_test 5 "HEAVY" ;;
        3) run_test 12 "WAR" ;;
        4) stop_test; read -p "Press Enter to continue..." ;;
        5) exit 0 ;;
        *) echo "Invalid choice." ;;
    esac
done
