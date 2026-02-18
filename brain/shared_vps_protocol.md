# Shared VPS Coexistence Protocol

**Status:** Active
**Implemented:** Feb 18, 2026
**Purpose:** Manage shared root access with "Team B" while protecting UniZ infrastructure.

---

## 1. Automated Architecture Protection

The VPS is configured with strict safeguards to prevent "Team B" from accidentally destroying the UniZ deployment.

### A. Immutable File Locking

The deployment directory `/root/uniz-infrastructure` is bit-locked using `chattr +i`.

- **Effect**: `rm -rf`, `mv`, or modifying files returns **"Operation not permitted"**, even for the root user.
- **Why**: Prevents accidental deletion or `docker compose down` on the wrong folder.

### B. Unlock Procedure (For Admin/You)

To deploy new code or edit configurations, you must unlock the system.

1. Run: `uniz-unlock`
2. Password: `sree@2006`
3. Perform work.
4. Run: `uniz-lock` to re-secure.

### C. Port Reservation (MOTD)

A dynamic banner (`/etc/update-motd.d/99-uniz-warning`) appears on SSH login.

- **Warns**: "CRITICAL NOTICE: DO NOT STOP/REMOVE uniz-\* containers."
- **Reserves**: Ports 80, 443, 3000-3010, 5432, 6379 for UniZ.
- **Instructs**: Team B to use Ports **4000-5000**.

### D. Automated Disaster Recovery

A daily cron job runs at 03:00 UTC.

- **Script**: `~/backup-uniz.sh`
- **Destination**: `/root/uniz-backups/YYYY-MM-DD/`
- **Content**: Full copy of `uniz-infrastructure` + list of running containers.
- **Retention**: Last 5 days.

---

## 2. Team Communication Scripts

Use these responses if the other team or administration inquires about the configuration.

### Scenario: "Why can't we use Port 80?"

> "The server can only have one Gateway listening on Port 80. My Nginx Gateway handles this optimization. Please run your app on Port 4000+, let me know, and I will configure a reverse proxy rule (e.g., `teamb.uniz.rguktong.in` -> `localhost:4000`) so both our apps run securely under HTTPS."

### Scenario: "Why is the folder locked?"

> "I've locked the production deployment folder to prevent accidental deletions or overwrites. A single command could take down the live portal. Please create your own directory (e.g., `~/teamb-project`) for your work. You have full root access to the rest of the server."

### Scenario: "What is the password for?"

> "It's a safety latch for my team's deployment pipeline to prevent unauthorized changes during peak usage. It doesn't affect your ability to create your own folders or run your own containers."

---

## 3. Hostinger / System Health Status (Feb 18)

- **Disk**: ~24GB Used / 200GB (Cleaned)
- **PgBouncer**: Configured to ignore `search_path` parameter (Fixed Cron errors).
- **OS Health**: 0 failed systemd units.
