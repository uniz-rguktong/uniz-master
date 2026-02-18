const autocannon = require("autocannon");

console.log(" Initializing Super Stress Test...");
console.log("Target: api.uniz.rguktong.in");
console.log("Concurrency: 500 users");
console.log("Duration: 60 seconds");

const instance = autocannon(
  {
    url: "https://api.uniz.rguktong.in",
    connections: 500,
    duration: 60,
    pipelining: 10,
    headers: {
      "content-type": "application/json",
    },
  },
  (err, results) => {
    if (err) {
      console.error("Test Error:", err);
      return;
    }
    console.log("\n STRESS TEST COMPLETE");
    console.log("---------------------------");
    console.log(`Throughput: ${results["requests"].average} req/sec`);
    console.log(`Mean Latency: ${results.latency.average} ms`);
    console.log(`Total Requests: ${results["requests"].total}`);
    console.log(
      `Success Rate: ${Math.round((results["2xx"] / results["requests"].total) * 100)}%`,
    );
    console.log("---------------------------");
  },
);

// Print status every 5 seconds
let seconds = 0;
const interval = setInterval(() => {
  seconds += 5;
  if (seconds >= 60) {
    clearInterval(interval);
  } else {
    console.log(`⏱  Running... ${seconds}s elapsed`);
  }
}, 5000);

autocannon.track(instance);
