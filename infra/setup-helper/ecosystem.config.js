module.exports = {
  apps: [
    {
      name: "uniz-gateway",
      script: "./uniz-production-gateway/index.js", // Assuming you'll build/transpile or use ts-node
      instances: 1, // Optimized for 2 vCPU: Keep 1 gateway, save cores for Auth
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
    {
      name: "uniz-auth",
      cwd: "./uniz-auth-service",
      script: "npm",
      args: "start",
      instances: "max", // Use all available cores (2) for Auth hashing
      exec_mode: "cluster",
    },
    {
      name: "uniz-users",
      cwd: "./uniz-user-service",
      script: "npm",
      args: "start",
      instances: 1,
      exec_mode: "fork", // Simple services can run in fork mode to save overhead if load is low
    },
    {
      name: "uniz-outpass",
      cwd: "./uniz-outpass-service",
      script: "npm",
      args: "start",
      instances: 1,
      exec_mode: "fork",
    },
    {
      name: "uniz-academics",
      cwd: "./uniz-academics-service",
      script: "npm",
      args: "start",
      instances: 1,
      exec_mode: "fork",
    },
  ],
};
