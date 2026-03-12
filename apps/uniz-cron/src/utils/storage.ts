import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

/**
 * Executes a series of system-level storage cleanup commands.
 * This is intended to be run in a container with host-level access or a similar privileged environment.
 * In the context of the UniZ VPS (Ubuntu/K3s), these commands help reclaim significant space.
 */
export const runStorageCleanup = async () => {
  console.log("[STORAGE] Starting automated system storage cleanup...");

  const commands = [
    {
      name: "Docker System Prune",
      cmd: 'docker system prune -af --volumes --filter "until=24h"',
    },
    {
      name: "Docker Image Prune",
      cmd: 'docker image prune -af --filter "until=24h"',
    },
    {
      name: "Docker Build Cache Prune",
      cmd: 'docker builder prune -af --filter "until=24h"',
    },
    {
      name: "Container Log Truncation",
      cmd: "find /var/lib/docker/containers/ -name '*-json.log' -exec truncate -s 0 {} \\;",
    },
    {
      name: "K3s Image Prune",
      cmd: "crictl --runtime-endpoint unix:///run/k3s/containerd/containerd.sock rmi --prune",
    },
    { name: "Journal Log Vacuum", cmd: "journalctl --vacuum-time=1d" },
    { name: "Apt Cleanup", cmd: "apt-get clean && apt-get autoremove -y" },
    { name: "Temp File Cleanup", cmd: "rm -rf /tmp/* /var/tmp/*" },
  ];

  for (const { name, cmd } of commands) {
    try {
      console.log(`[STORAGE] Executing: ${name}...`);
      const { stdout, stderr } = await execAsync(cmd);
      if (stderr) console.warn(`[STORAGE] [${name}] Warning:`, stderr);
      console.log(`[STORAGE] [${name}] Success.`);
    } catch (error: any) {
      // We ignore errors here as some commands might fail if permissions aren't perfect
      // or if a tool (like docker) isn't installed in the specific environment.
      console.error(`[STORAGE] [${name}] Failed:`, error.message);
    }
  }

  try {
    const { stdout } = await execAsync("df -h /");
    console.log("[STORAGE] Final disk status:\n", stdout);
  } catch (e) {}

  console.log("[STORAGE] Automated cleanup complete.");
};
