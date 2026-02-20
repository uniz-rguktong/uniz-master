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
    
    local frame=0
    # Live Dashboard Loop
    while true; do
        # Animation frames for "Incoming Traffic"
        local frames=(">>      " " >>     " "  >>    " "   >>   " "    >>  " "     >> " "      >>")
        local flow=${frames[$((frame % 7))]}
        ((frame++))

        clear
        banner
        echo -e "${BOLD}TRAFFIC STATUS:${NC} $mode [${RED}${BOLD}$flow${NC}] | ${BOLD}ACTIVE BOTS:${NC} $count"
        echo -e "${CYAN}----------------------------------------------------------------${NC}"
        
        # Deployment Scaling Progress Bars
        printf "${BOLD}%-24s %-12s %-25s${NC}\n" "SERVICE" "EST. REQ" "SCALING STATUS"
        
        # 1. Gateway API
        gw_repl=$(kubectl get deployment uniz-gateway-api -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo 0)
        gw_bar=$(printf '█%.0s' $(seq 1 $gw_repl))
        printf "%-24s %-12s [${GREEN}%-15s${NC}]\n" "Gateway API" "$((gw_repl * 300))/s" "$gw_bar"

        # 2. User Service
        u_repl=$(kubectl get deployment uniz-user-service -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo 0)
        u_bar=$(printf '█%.0s' $(seq 1 $u_repl))
        printf "%-24s %-12s [${BLUE}%-10s${NC}]\n" "User Profile" "$((u_repl * 200))/s" "$u_bar"

        # 3. Academics Service
        a_repl=$(kubectl get deployment uniz-academics-service -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo 0)
        a_bar=$(printf '█%.0s' $(seq 1 $a_repl))
        printf "%-24s %-12s [${YELLOW}%-10s${NC}]\n" "Academics/PDF" "$((a_repl * 50))/s" "$a_bar"

        # 4. Auth Service
        au_repl=$(kubectl get deployment uniz-auth-service -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo 0)
        au_bar=$(printf '█%.0s' $(seq 1 $au_repl))
        printf "%-24s %-12s [${PURPLE}%-10s${NC}]\n" "Auth Engine" "$((au_repl * 400))/s" "$au_bar"

        echo -e "${CYAN}----------------------------------------------------------------${NC}"
        
        # HPA Live Metrics
        echo -e "${BOLD}AUTOSCALER BRAIN:${NC}"
        kubectl get hpa --no-headers 2>/dev/null | grep -E "gateway-api|user-service|academics-service|auth-service" | awk '{
            status = ($3 ~ /%/ ? (substr($3,1,index($3,"%")-1)+0 > (substr($4,1,index($4,"%")-1)+0) ? "🔥 SPIKE" : "✅ OK") : "⏳ WARM")
            printf "  %-18s: %-10s %-8s Pods: %s/%s\n", $1, status, $3, $6, $5
        }'
        
        echo -e "${CYAN}----------------------------------------------------------------${NC}"
        echo -e "${YELLOW}Press Ctrl+C to stop LOAD and enter COOLDOWN phase...${NC}"
        
        sleep 1
    done
}

function cooldown() {
    clear
    banner
    echo -e "${BOLD}🛑 ENTERING COOLDOWN PHASE${NC}"
    echo -e "${CYAN}----------------------------------------------------------------${NC}"
    stop_test
    echo -e "${BLUE}Monitoring cluster as pods terminate...${NC}"
    
    for i in {1..12}; do
        clear
        banner
        echo -e "${BOLD}PHASE:${NC} ${GREEN}COOLDOWN${NC}"
        echo -e "${CYAN}----------------------------------------------------------------${NC}"
        
        # Show all services shrinking
        for svc in "uniz-gateway-api" "uniz-user-service" "uniz-academics-service" "uniz-auth-service"; do
             repl=$(kubectl get deployment $svc -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo 0)
             bar=$(printf '█%.0s' $(seq 1 $repl))
             printf "%-25s [${RED}%-15s${NC}]\n" "$svc" "$bar"
        done
        
        echo -e "\n${YELLOW}System is reducing capacity to save VPS resources...${NC}"
        echo -e "Cooldown Progress: $i/12 seconds"
        sleep 1
    done
    echo -e "${GREEN}✅ System Fully Cooled.${NC}"
}

# Trap Ctrl+C to move to cooldown
trap "echo -e '\nStopping load...'; return" SIGINT

while true; do
    banner
    show_menu
    case $choice in
        1) run_test 2 "LITE"; cooldown ;;
        2) run_test 5 "HEAVY"; cooldown ;;
        3) run_test 12 "WAR"; cooldown ;;
        4) stop_test; read -p "Press Enter to continue..." ;;
        5) exit 0 ;;
        *) echo "Invalid choice." ;;
    esac
done
