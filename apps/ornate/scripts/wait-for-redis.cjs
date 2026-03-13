const net = require('net');

const host = process.env.REDIS_WAIT_HOST || '127.0.0.1';
const port = Number(process.env.REDIS_WAIT_PORT || 6380);
const timeoutMs = Number(process.env.REDIS_WAIT_TIMEOUT_MS || 30000);
const intervalMs = Number(process.env.REDIS_WAIT_INTERVAL_MS || 500);

const start = Date.now();

function tryConnect() {
  return new Promise((resolve) => {
    const socket = net.connect({ host, port });

    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });

    socket.on('error', () => {
      socket.destroy();
      resolve(false);
    });

    socket.setTimeout(2000, () => {
      socket.destroy();
      resolve(false);
    });
  });
}

(async () => {
  while (Date.now() - start < timeoutMs) {
    const ok = await tryConnect();
    if (ok) {
      console.log(`[wait-for-redis] Redis is ready at ${host}:${port}`);
      process.exit(0);
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }

  console.error(`[wait-for-redis] Timed out waiting for Redis at ${host}:${port}`);
  process.exit(1);
})();
