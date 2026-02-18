# GoDaddy VPS Deployment Guide (High Traffic Edition)

This is your master checklist and runbook for deploying UniZ to a GoDaddy VPS. This setup is specifically tuned to handle **10,000 concurrent users** during "Result Day" events.

## 📋 Phase 1: Purchase & Prerequisites

### 1. Choice of Server

- **GoDaddy VPS**: Follow the standard plan.
- **Azure for Students**:
  1. Sign up at [azure.microsoft.com/free/students/](https://azure.microsoft.com/free/students/).
  2. Create a Virtual Machine: **Ubuntu 24.04**.
  3. Size: **Standard_B2s** (2 vCPU, 4GB RAM) - Matches your 'Economy' requirement.
  4. **Networking (CRITICAL)**: In the Azure "Network Security Group" (NSG), add Inbound rules for:
     - Port 80 (HTTP)
     - Port 443 (HTTPS)
     - Port 22 (SSH)
  5. **Region**: Select **Central India (Pune)** for lowest latency.

### 2. Configure DNS

- Go to your Domain DNS Management.
- Create an **A Record**:
  - **Host**: `api` (or `@` for root domain)
  - **Value**: `YOUR_VPS_IP_ADDRESS` (e.g., 123.45.67.89)
  - **TTL**: 600 seconds

---

## Phase 2: Server Setup (One-Time)

### 1. SSH into Server

Open your terminal (Mac/Linux) or PowerShell (Windows).

```bash
ssh root@YOUR_VPS_IP
# Enter password you set during purchase
```

### 2. Run the Auto-Setup Script

I have prepared a script `deploy_config/setup_vps.sh` that installs Node.js, Nginx, Redis, and tunes the Linux kernel for 65k connections.

On your **local machine** (not the server), upload the script:

```bash
scp deploy_config/setup_vps.sh root@YOUR_VPS_IP:~/setup_vps.sh
```

Back on the **server**:

```bash
chmod +x setup_vps.sh
./setup_vps.sh
```

---

## Phase 3: Application Deployment

### 1. Clone Codebase

```bash
# On the VPS
git clone https://github.com/uniz-rguktong/uniz-rguktong.git
cd uniz-rguktong
```

### 2. Install Dependencies

```bash
# Root dependencies
npm install

# Install Service dependencies
(cd uniz-auth-service && npm install)
(cd uniz-user-service && npm install)
(cd uniz-outpass-service && npm install)
(cd uniz-academics-service && npm install)
(cd uniz-production-gateway && npm install)
```

### 3. Configure Environment Variables (CRITICAL)

You must create a `.env` file for **EACH** service.

- `uniz-auth-service/.env`
- `uniz-user-service/.env`
- `uniz-outpass-service/.env`
- `uniz-academics-service/.env`

**Example contents for `uniz-academics-service/.env`**:

```env
DATABASE_URL="postgresql://neondb_owner:npg_5ulZqX3YDptG@ep-frosty-mud-ahwpoi10-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&schema=academics"
JWT_SECURITY_KEY="uniz_vault_secure_2026_key"
PORT=3004
```

_Repeat for all services ensuring correct DB URL Schemas and PORTs (3001, 3002, 3003)._

---

## Phase 4: Launch & Network

### 1. Start Microservices with PM2

We use the generated `ecosystem.config.js` to run mapped clusters.

```bash
# From uniz-rguktong root directory
pm2 start deploy_config/ecosystem.config.js
pm2 save
pm2 startup
```

### 2. Configure Nginx (The Traffic Cop)

This file handles the 10k connections and caches "Result Day" traffic.

```bash
# Backup default
sudo mv /etc/nginx/nginx.conf /etc/nginx/nginx.conf.bak

# Copy our optimized config
sudo cp deploy_config/nginx_optimized.conf /etc/nginx/nginx.conf

# Test config is valid
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

---

## 🚦 Phase 5: "Result Day" Procedure

**Follow this exactly on the morning of results.**

1.  **Flush Cache**: Ensure students don't see old data.
    ```bash
    # On VPS
    sudo rm -rf /var/cache/nginx/*
    sudo systemctl reload nginx
    ```
2.  **Monitor Load**: Watch the server live.
    ```bash
    pm2 monit
    ```
3.  **Scale Auth (If needed)**: If login is slow, add more auth workers.
    ```bash
    pm2 scale uniz-auth +2
    ```

## Verification Checklist

- [ ] SSH works without password (ssh-key recommended).
- [ ] `node -v` returns v20+.
- [ ] `pm2 list` shows all 5 services as "online".
- [ ] `curl http://localhost:3001/health` works internally.
- [ ] `curl http://YOUR_VPS_IP/health` works externally via Nginx.
