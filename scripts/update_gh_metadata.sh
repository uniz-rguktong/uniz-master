#!/bin/bash
set -e

declare -A DESCS
DESCS["uniz-portal"]="Elite Student Portal: Professional React/Vite dashboard for campus management, academic tracking, and digital outpass workflows."
DESCS["uniz-auth"]="Identity Provider: Secure OAuth2/JWT authentication service with multi-role support and MFA capabilities."
DESCS["uniz-user"]="User Profile Service: Centralized profile management for students, faculty, and administration with high-concurrency Redis caching."
DESCS["uniz-academics"]="Academic Engine: Orchestrates grades, attendance, and curriculum data with automated GPAC calculations and bulk ingestion."
DESCS["uniz-outpass"]="Workflow Orchestrator: Smart routing and approval engine for campus movement requests, outings, and gate security integration."
DESCS["uniz-mail"]="Communication Hub: Centralized SMTP/API email delivery service for security alerts, reports, and system notifications."
DESCS["uniz-files"]="Asset Infrastructure: High-availability storage and delivery service for profile assets, PDF reports, and campus media."
DESCS["uniz-notifications"]="Real-time Event Bus: Low-latency notification delivery system for instant web and mobile alerts using WebSockets."
DESCS["uniz-cron"]="Schedule Controller: Managed background processor for recurring tasks, system cleanup, and automated reporting."
DESCS["uniz-gateway"]="Edge Gateway: High-performance API routing, edge caching, and Vercel-optimized request orchestration."
DESCS["uniz-infrastructure"]="Cloud Orchestration: Production-grade DevOps infrastructure for Docker-based microservice deployment and network routing."
DESCS["uniz-shared"]="Core Library: Shared TypeScript types, utility functions, and domain logic used across the entire UniZ ecosystem."
DESCS["uniz-master-vault"]="Master Archive: Consolidated monorepo containing the entire UniZ ecosystem source code, configurations, and environment secrets."

declare -A TOPICS
TOPICS["uniz-portal"]="uniz,rgukt,react,vite,dashboard"
TOPICS["uniz-auth"]="uniz,rgukt,auth,jwt,security"
TOPICS["uniz-user"]="uniz,rgukt,profiles,redis,user-management"
TOPICS["uniz-academics"]="uniz,rgukt,academics,education,automation"
TOPICS["uniz-outpass"]="uniz,rgukt,workflows,automation,logistics"
TOPICS["uniz-mail"]="uniz,rgukt,email,notifications,smtp"
TOPICS["uniz-files"]="uniz,rgukt,storage,assets,cdn"
TOPICS["uniz-notifications"]="uniz,rgukt,websockets,real-time,events"
TOPICS["uniz-cron"]="uniz,rgukt,cron,background-jobs,scheduler"
TOPICS["uniz-gateway"]="uniz,rgukt,gateway,vercel,proxy"
TOPICS["uniz-infrastructure"]="uniz,rgukt,devops,docker,infrastructure"
TOPICS["uniz-shared"]="uniz,rgukt,typescript,shared-library,shared-logic"
TOPICS["uniz-master-vault"]="uniz,rgukt,monorepo,backup,vault"

for repo in "${!DESCS[@]}"; do
    echo "Updating $repo..."
    # Set description first
    gh repo edit "uniz-rguktong/$repo" --description "${DESCS[$repo]}"
    
    # Add topics one by one safely
    IFS=',' read -ra ADDR <<< "${TOPICS[$repo]}"
    for topic in "${ADDR[@]}"; do
        gh repo edit "uniz-rguktong/$repo" --add-topic "$topic"
    done
done
