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

  const checkTool = async (tool: string) => {
    try {
      await execAsync(`command -v ${tool}`);
      return true;
    } catch {
      return false;
    }
  };

  const commands = [
    {
      name: "Docker System Prune",
      tool: "docker",
      cmd: 'docker system prune -af --volumes --filter "until=24h"',
    },
    {
      name: "Docker Image Prune",
      tool: "docker",
      cmd: 'docker image prune -af --filter "until=24h"',
    },
    {
      name: "Docker Build Cache Prune",
      tool: "docker",
      cmd: 'docker builder prune -af --filter "until=24h"',
    },
    {
      name: "Container Log Truncation",
      tool: "find",
      cmd: "find /var/lib/docker/containers/ -name '*-json.log' -exec truncate -s 0 {} \\;",
    },
    {
      name: "K3s Image Prune",
      tool: "crictl",
      cmd: "crictl --runtime-endpoint unix:///run/k3s/containerd/containerd.sock rmi --prune",
    },
    {
      name: "Journal Log Vacuum",
      tool: "journalctl",
      cmd: "journalctl --vacuum-time=1d",
    },
    {
      name: "Apt Cleanup",
      tool: "apt-get",
      cmd: "apt-get clean && apt-get autoremove -y",
    },
    {
      name: "Temp File Cleanup",
      tool: "rm",
      cmd: "rm -rf /tmp/* /var/tmp/*",
    },
  ];

  for (const { name, tool, cmd } of commands) {
    try {
      if (!(await checkTool(tool))) {
        console.log(`[STORAGE] Skipping ${name}: Tool '${tool}' not found.`);
        continue;
      }

      console.log(`[STORAGE] Executing: ${name}...`);
      const { stderr } = await execAsync(cmd);
      if (stderr) console.warn(`[STORAGE] [${name}] Warning:`, stderr);
      console.log(`[STORAGE] [${name}] Success.`);
    } catch (error: any) {
      console.error(`[STORAGE] [${name}] Failed:`, error.message);
    }
  }

  try {
    const { stdout } = await execAsync("df -h /");
    console.log("[STORAGE] Final disk status:\n", stdout);
  } catch (e) {}

  console.log("[STORAGE] Automated cleanup complete.");
};
