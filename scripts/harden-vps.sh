#!/usr/bin/env bash
# Idempotent VPS security hardening (run on the VPS after deploy).
set -euo pipefail

MARKER="uniz-vps-hardening"
DOCKER_FW="/usr/local/bin/uniz-docker-firewall.sh"
SSH_DROPIN="/etc/ssh/sshd_config.d/99-uniz-hardening.conf"

echo "[$MARKER] Starting VPS hardening..."

# --- 1. SSH: key-only, no password brute-force surface ---
cat >"$SSH_DROPIN" <<'EOF'
# Managed by scripts/harden-vps.sh — do not edit manually
PasswordAuthentication no
KbdInteractiveAuthentication no
PermitRootLogin prohibit-password
MaxAuthTries 3
X11Forwarding no
AllowAgentForwarding no
EOF
chmod 644 "$SSH_DROPIN"
sshd -t
systemctl reload ssh 2>/dev/null || systemctl reload sshd
echo "[$MARKER] SSH hardened (key-only)"

# --- 2. fail2ban: tighter sshd jail ---
mkdir -p /etc/fail2ban/jail.d
cat >/etc/fail2ban/jail.d/uniz-sshd.local <<'EOF'
[sshd]
enabled = true
maxretry = 3
findtime = 10m
bantime = 1h
EOF
systemctl enable fail2ban >/dev/null 2>&1 || true
systemctl restart fail2ban
echo "[$MARKER] fail2ban tightened"

# --- 3. pgbouncer: localhost only (was listen_addr = *) ---
if [[ -f /etc/pgbouncer/pgbouncer.ini ]]; then
  if grep -q '^listen_addr = \*' /etc/pgbouncer/pgbouncer.ini; then
    sed -i 's/^listen_addr = \*/listen_addr = 127.0.0.1/' /etc/pgbouncer/pgbouncer.ini
    systemctl restart pgbouncer
    echo "[$MARKER] pgbouncer bound to 127.0.0.1"
  fi
fi

# --- 4. Block internet access to Docker admin ports (Docker bypasses UFW) ---
cat >"$DOCKER_FW" <<'SCRIPT'
#!/usr/bin/env bash
set -euo pipefail

BLOCK_PORTS=(5432 5433 6432 6379 8000)
ALLOW_CIDRS=(127.0.0.0/8 10.42.0.0/16 172.16.0.0/12)

iptables -N DOCKER-USER 2>/dev/null || true

if ! iptables -C DOCKER-USER -m conntrack --ctstate RELATED,ESTABLISHED -j RETURN 2>/dev/null; then
  iptables -I DOCKER-USER 1 -m conntrack --ctstate RELATED,ESTABLISHED -j RETURN
fi

for port in "${BLOCK_PORTS[@]}"; do
  for cidr in "${ALLOW_CIDRS[@]}"; do
    if ! iptables -C DOCKER-USER -p tcp --dport "$port" -s "$cidr" -j RETURN 2>/dev/null; then
      iptables -A DOCKER-USER -p tcp --dport "$port" -s "$cidr" -j RETURN
    fi
  done
  if ! iptables -C DOCKER-USER -p tcp --dport "$port" -j DROP 2>/dev/null; then
    iptables -A DOCKER-USER -p tcp --dport "$port" -j DROP
  fi
done

if ! iptables -C DOCKER-USER -j RETURN 2>/dev/null; then
  iptables -A DOCKER-USER -j RETURN
fi
SCRIPT
chmod +x "$DOCKER_FW"

cat >/etc/systemd/system/uniz-docker-firewall.service <<EOF
[Unit]
Description=UniZ Docker port firewall (block public DB/admin ports)
After=docker.service network-online.target
Wants=network-online.target

[Service]
Type=oneshot
RemainAfterExit=yes
ExecStart=$DOCKER_FW

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable uniz-docker-firewall.service >/dev/null
systemctl restart uniz-docker-firewall.service
echo "[$MARKER] Docker admin ports blocked from internet"

# --- 5. UFW: only SSH + HTTP/S public (idempotent — never reset during deploy) ---
if ! ufw status 2>/dev/null | grep -q "Status: active"; then
  ufw default deny incoming >/dev/null
  ufw default allow outgoing >/dev/null
fi
ufw allow OpenSSH >/dev/null 2>&1 || true
ufw allow 'Nginx Full' >/dev/null 2>&1 || true
ufw --force enable >/dev/null 2>&1 || true
echo "[$MARKER] UFW enabled (22, 80, 443 only)"

# --- 6. Automatic security updates ---
apt-get install -y unattended-upgrades apt-listchanges >/dev/null 2>&1 || true
cat >/etc/apt/apt.conf.d/20auto-upgrades <<'EOF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
APT::Periodic::AutocleanInterval "7";
EOF
echo "[$MARKER] unattended-upgrades configured"

# --- 7. Kernel hardening (idempotent append) ---
SYSCTL_MARKER="# uniz-vps-hardening"
if ! grep -q "$SYSCTL_MARKER" /etc/sysctl.conf 2>/dev/null; then
  cat >>/etc/sysctl.conf <<EOF

$SYSCTL_MARKER
net.ipv4.conf.all.rp_filter = 1
net.ipv4.conf.default.rp_filter = 1
net.ipv4.tcp_syncookies = 1
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.default.accept_redirects = 0
EOF
  sysctl -p >/dev/null 2>&1 || true
  echo "[$MARKER] sysctl hardening applied"
fi

echo "[$MARKER] Done — verify: ufw status, ss -tlnp, ssh key login still works"
