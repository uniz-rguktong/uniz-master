import { exec } from "child_process";
import { promisify } from "util";
import { access } from "fs/promises";
import { constants } from "fs";

const execAsync = promisify(exec);

const CRI_SOCK = "/run/k3s/containerd/containerd.sock";

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function socketExists(path: string): Promise<boolean> {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Executes host-level storage cleanup inside a privileged CronJob pod.
 * Prefers K3s/containerd (crictl) over Docker — many UniZ VPS nodes have no docker.sock.
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

  const hasDockerSock = await socketExists("/var/run/docker.sock");
  const hasCriSock = await socketExists(CRI_SOCK);

  const commands: Array<{ name: string; tool: string; cmd: string; when?: boolean }> = [
    {
      name: "K3s Image Prune (crictl)",
      tool: "crictl",
      cmd: `crictl --runtime-endpoint unix://${CRI_SOCK} rmi --prune`,
      when: hasCriSock,
    },
    {
      name: "K3s Image Prune (k3s crictl)",
      tool: "k3s",
      cmd: "k3s crictl rmi --prune",
      when: hasCriSock,
    },
    {
      name: "Docker System Prune",
      tool: "docker",
      cmd: 'docker system prune -af --volumes --filter "until=24h"',
      when: hasDockerSock,
    },
    {
      name: "Docker Image Prune",
      tool: "docker",
      cmd: 'docker image prune -af --filter "until=24h"',
      when: hasDockerSock,
    },
    {
      name: "Docker Build Cache Prune",
      tool: "docker",
      cmd: 'docker builder prune -af --filter "until=24h"',
      when: hasDockerSock,
    },
    {
      name: "Container Log Truncation",
      tool: "find",
      cmd: "find /var/lib/docker/containers/ -name '*-json.log' -exec truncate -s 0 {} \\;",
      when: await pathExists("/var/lib/docker/containers"),
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

  for (const { name, tool, cmd, when } of commands) {
    if (when === false) {
      console.log(`[STORAGE] Skipping ${name}: prerequisite not available.`);
      continue;
    }

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
    const { stdout } = await execAsync("df -h / /var 2>/dev/null || df -h /");
    console.log("[STORAGE] Final disk status:\n", stdout);
  } catch (e) {
    // non-fatal
  }

  console.log("[STORAGE] Automated cleanup complete.");
};
