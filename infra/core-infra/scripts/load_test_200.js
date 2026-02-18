const { execSync, spawn } = require("child_process");
const fs = require("fs");

const BACKEND_URL = "https://api.uniz.rguktong.in/api/v1/system/health";
const FRONTEND_URL = "https://uniz.rguktong.in/";
const DURATION = 30; // seconds
const CONNECTIONS = 200; // Reduced to 200 for a realistic load test
const PIPELINING = 1;

console.log(`\n🚀 Starting UniZ Load Test - 200 Concurrent Users Simulation`);
console.log(`===========================================================`);
console.log(`Target Backend: ${BACKEND_URL}`);
console.log(`Target Frontend: ${FRONTEND_URL}`);
console.log(`Duration: ${DURATION}s each`);
console.log(`Connections: ${CONNECTIONS}`);
console.log(`===========================================================\n`);

let monitorProcess;
function startMonitoring() {
  console.log(`📡 Starting remote server resource monitoring...`);
  monitorProcess = spawn("ssh", [
    "-i",
    "~/.ssh/id_ed25519",
    "root@76.13.241.174",
    'while true; do echo "--- $(date) ---"; docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"; sleep 5; done',
  ]);

  monitorProcess.stdout.on("data", (data) => {
    fs.appendFileSync("logs/load_test_monitor.log", data);
  });
}

function stopMonitoring() {
  if (monitorProcess) {
    console.log(`\n🛑 Stopping remote monitoring...`);
    monitorProcess.kill();
  }
}

function runLoadTest(url, name) {
  console.log(`\n⚡ Testing ${name} (${url})...`);
  try {
    const cmd = `npx autocannon -c ${CONNECTIONS} -d ${DURATION} --latency "${url}"`;
    execSync(cmd, { stdio: "inherit" });
    console.log(`✅ ${name} test completed.`);
  } catch (error) {
    console.error(`❌ ${name} test failed:`, error.message);
  }
}

(async () => {
  if (!fs.existsSync("logs")) fs.mkdirSync("logs");
  fs.writeFileSync("logs/load_test_monitor.log", "");

  startMonitoring();
  await new Promise((r) => setTimeout(r, 2000));

  console.log(`\n--- Phase 1: Backend API Check ---`);
  runLoadTest(BACKEND_URL, "Backend API");

  console.log(`\nTaking a 5s breather...`);
  await new Promise((r) => setTimeout(r, 5000));

  console.log(`\n--- Phase 2: Frontend Check ---`);
  runLoadTest(FRONTEND_URL, "Frontend (Vercel)");

  stopMonitoring();

  console.log(`\n📊 Test Complete.`);
  console.log(
    `Check logs/load_test_monitor.log to see if CPU usage remained manageable.`,
  );
})();
