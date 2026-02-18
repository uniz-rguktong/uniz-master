const { execSync, spawn } = require("child_process");
const fs = require("fs");

const BACKEND_URL = "https://api.uniz.rguktong.in/api/v1/system/health";
const FRONTEND_URL = "https://uniz.rguktong.in/";
const DURATION = 30; // seconds
const CONNECTIONS = 1500;
const PIPELINING = 1; // standard non-pipelined requests

console.log(`\n🚀 Starting UniZ Load Test - 1.5k Concurrent Users Simulation`);
console.log(`===========================================================`);
console.log(`Target Backend: ${BACKEND_URL}`);
console.log(`Target Frontend: ${FRONTEND_URL}`);
console.log(`Duration: ${DURATION}s each`);
console.log(`Connections: ${CONNECTIONS}`);
console.log(`===========================================================\n`);

// Function to monitor remote server resources
let monitorProcess;
function startMonitoring() {
  console.log(`📡 Starting remote server resource monitoring...`);
  // SSH into VPS and run docker stats every second
  // Using a loop because docker stats --no-stream only runs once
  // A better approach is to use `vmstat` or `top` for overall system health,
  // but docker stats gives container breakdown which is what we care about.
  // However, capturing streaming output from SSH is tricky in a single spawn.
  // Let's just sample it at start, middle, and end or use a loop remotely.

  // We'll spawn a background process that logs to a file locally if possible or just stdout
  // For simplicity here, we'll just run a quick check before and after.
  // Ideally, we'd stream it. Let's try streaming to stdout.

  monitorProcess = spawn("ssh", [
    "-i",
    "~/.ssh/id_ed25519",
    "root@76.13.241.174",
    'while true; do echo "--- $(date) ---"; docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"; sleep 5; done',
  ]);

  monitorProcess.stdout.on("data", (data) => {
    // Only print if significant change or just log to file?
    // Let's log to file `logs/load_test_monitor.log`
    fs.appendFileSync("logs/load_test_monitor.log", data);
  });

  monitorProcess.stderr.on("data", (data) => {
    // console.error(`Monitor Error: ${data}`);
  });
}

function stopMonitoring() {
  if (monitorProcess) {
    console.log(`\n🛑 Stopping remote monitoring...`);
    monitorProcess.kill();
  }
}

// Function to run autocannon
function runLoadTest(url, name) {
  console.log(`\n⚡ Testing ${name} (${url})...`);
  try {
    // Using npx autocannon.
    // -c connections, -d duration, -l latency distribution
    const cmd = `npx autocannon -c ${CONNECTIONS} -d ${DURATION} --latency "${url}"`;
    // We inherit stdio so user sees the progress bar and result
    execSync(cmd, { stdio: "inherit" });
    console.log(`✅ ${name} test completed.`);
  } catch (error) {
    console.error(`❌ ${name} test failed:`, error.message);
  }
}

// Main execution
(async () => {
  // Ensure logs dir exists
  if (!fs.existsSync("logs")) fs.mkdirSync("logs");
  fs.writeFileSync("logs/load_test_monitor.log", ""); // Clear old log

  startMonitoring();

  // Give monitoring a moment to connect
  await new Promise((r) => setTimeout(r, 2000));

  console.log(`\n--- Phase 1: Backend API Check ---`);
  runLoadTest(BACKEND_URL, "Backend API");

  // Wait a bit between tests
  console.log(`\nTaking a 5s breather...`);
  await new Promise((r) => setTimeout(r, 5000));

  console.log(`\n--- Phase 2: Frontend Check ---`);
  runLoadTest(FRONTEND_URL, "Frontend (Vercel)");

  stopMonitoring();

  console.log(`\n📊 Test Complete.`);
  console.log(
    `Check logs/load_test_monitor.log for detailed server stats during the test.`,
  );
})();
