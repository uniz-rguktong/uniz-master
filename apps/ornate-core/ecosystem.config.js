/**
 * PM2 Ecosystem Configuration for VPS Production Deployment
 * ─────────────────────────────────────────────────────────
 *
 * CRITICAL NOTES:
 *
 * 1. WORKER COUNT:
 *    Start with 2 workers (not max cores). Each worker spawns its own:
 *    - Prisma connection pool
 *    - Chrome process (for certificate PDF generation)
 *    - In-memory caches (limiter cache, PDF cache, etc.)
 *    With 4+ workers on a 16GB VPS, you risk exhausting PostgreSQL
 *    connections and consuming 2-4GB+ on Chrome alone.
 *
 * 2. DATABASE_URL must include connection pool limits:
 *    DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=5&pool_timeout=10"
 *
 *    Why: Prisma defaults to `num_cpus * 2 + 1` connections per process.
 *    On a 4-core VPS with 2 PM2 workers: 2 × (4*2+1) = 18 connections.
 *    With connection_limit=5: 2 × 5 = 10 connections — safe headroom
 *    under PostgreSQL's default max_connections=100.
 *
 * 3. MEMORY LIMITS:
 *    max_memory_restart ensures a worker that leaks memory (e.g., from
 *    unclosed Chrome pages) is recycled before it destabilizes the VPS.
 *    1200M per worker = 2.4GB total for Next.js processes, leaving
 *    ample room for PostgreSQL, Redis, Chrome, and OS on a 16GB VPS.
 *
 * 4. LOG ROTATION:
 *    Install pm2-logrotate to prevent unbounded log growth:
 *      pm2 install pm2-logrotate
 *      pm2 set pm2-logrotate:max_size 50M
 *      pm2 set pm2-logrotate:retain 7
 *      pm2 set pm2-logrotate:compress true
 */
module.exports = {
  apps: [
    {
      name: "ornate-core",
      script: "node_modules/.bin/next",
      args: "start --port 3000",
      cwd: "./",

      // ── Cluster Configuration ──
      // Start with 2 workers. Scale up only after monitoring
      // memory and DB connection usage in production.
      instances: 2,
      exec_mode: "cluster",

      // ── Memory Safety ──
      // Auto-restart worker if it exceeds 1.2GB.
      // Prevents single-worker OOM from cascading.
      max_memory_restart: "1200M",

      // ── Graceful Shutdown ──
      // Give worker 8s to finish in-flight requests before SIGKILL.
      // Chrome cleanup handler needs ~2-3s (browserManager.ts).
      kill_timeout: 8000,
      listen_timeout: 10000,

      // ── Environment ──
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },

      // ── Crash Recovery ──
      // If a worker crashes 10 times within 60s, stop restarting.
      // Prevents restart storms from consuming all resources.
      max_restarts: 10,
      min_uptime: "10s",

      // ── Logging ──
      // Merge cluster worker logs into single files.
      // PM2 handles stdout/stderr split automatically.
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",

      // ── Watch (disabled for production) ──
      watch: false,
      ignore_watch: [
        "node_modules",
        ".next",
        "public/exports",
        "prisma/backups",
      ],
    },
  ],
};
