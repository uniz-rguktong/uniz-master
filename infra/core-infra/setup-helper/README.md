# UniZ VPS Deployment Guide - Enterprise Scale Implementation

![Ubuntu](https://img.shields.io/badge/Ubuntu-24.04-E95420?style=for-the-badge&logo=ubuntu&logoColor=white)
![Nginx](https://img.shields.io/badge/Nginx-High--Performance-009639?style=for-the-badge&logo=nginx&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![PM2](https://img.shields.io/badge/PM2-Advanced--Orchestration-2B037A?style=for-the-badge&logo=pm2&logoColor=white)

> **UniZ DEPLOYMENT BLUEPRINT 2026**
> _Step-by-step instructions for deploying the structuralized UniZ ecosystem to a high-performance Linux VPS environment._

## Phase 1: Infrastructure Provisioning

### 1. Server Specification

- **Recommended OS**: Ubuntu 24.04 LTS
- **Instance Size**: 4 vCPU, 8GB-16GB RAM (e.g., GoDaddy VPS High-RAM or Azure Standard_B4ms)
- **Region**: Select a region closest to the majority of student traffic (e.g., Central India for RGUKT Ongole)

### 2. Networking Configuration

Ensure the following ports are open in your VPS Firewall/NSG:

- **Port 80 (HTTP)**: Redirect to 443
- **Port 443 (HTTPS)**: Primary API/Portal traffic
- **Port 22 (SSH)**: Secure administration

## Phase 2: System Optimization (Server Setup)

### 1. Core Runtime Installation

Execute the core setup scripts to install the Node.js runtime, Redis cache, and Nginx proxy:

```bash
# SSH into the server
ssh root@YOUR_VPS_IP

# Run the unified setup command (requires deployment assets from repo)
# Refer to scripts/archive/setup_vps.sh for the baseline implementation
```

### 2. Kernel Tuning

The platform is tuned for high concurrency. Ensure `ip_local_port_range` is expanded and `file-max` is increased to support >65,000 simultaneous connections.

## Phase 3: Application Deployment

### 1. Structuralized Code Retrieval

Clone the Master Vault to the VPS home directory:

```bash
git clone https://github.com/uniz-rguktong/uniz-master.git
cd uniz-master
```

### 2. Dependency Orchestration

Utilize the centralized installation script to initialize the root and all sub-modules:

```bash
npm install
npm run install:all
```

### 3. Environment Synchronization

Populate `.env` files for each microservice within the `apps/` directory. Ensure `DATABASE_URL` entries include the correct schema parameters (e.g., `schema=auth`, `schema=academics`).

## Phase 4: Production Lifecycle Management

### 1. PM2 Orchestration

Use PM2 to manage service clusters and ensure zero-downtime restarts:

```bash
# Initialize ecosystem from the root
pm2 start deploy_config/ecosystem.config.js
pm2 save
pm2 startup
```

### 2. Nginx Proximity Config

Deploy the optimized Nginx configuration located in `infra/core-infra/nginx/` to the system:

```bash
sudo cp infra/core-infra/nginx/nginx_optimized.conf /etc/nginx/nginx.conf
sudo nginx -t && sudo systemctl restart nginx
```

## Phase 5: Result Day Scaling Protocol

During peak load events (Result announcements):

1. **Cache Purge**: `sudo rm -rf /var/cache/nginx/* && sudo systemctl reload nginx`
2. **Horizontal Scaling**: `pm2 scale uniz-auth +4` to handle intensified Bcrypt overhead.
3. **Monitor Latency**: `pm2 monit` to track real-time CPU and memory saturation.

---

<p align="center">
  Corporate Technical Infrastructure - internal Use Only
</p>
