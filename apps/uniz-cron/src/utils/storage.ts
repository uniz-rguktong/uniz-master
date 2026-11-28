import { execFile } from "child_process";
import { promisify } from "util";
import { access } from "fs/promises";
import { constants } from "fs";

const execFileAsync = promisify(execFile);

const CRI_SOCK = "/run/k3s/containerd/containerd.sock";
const RAW_CRICTL_TIMEOUT = (process.env.CRICTL_TIMEOUT || "10m").trim();
const CRICTL_TIMEOUT = /^\d+[smh]$/.test(RAW_CRICTL_TIMEOUT)
  ? RAW_CRICTL_TIMEOUT
  : "10m";

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
      await execFileAsync("sh", ["-c", 'command -v "$1" >/dev/null 2>&1', "--", tool]);
      return true;
    } catch {
      return false;
    }
  };

  const hasDockerSock = await socketExists("/var/run/docker.sock");
  const hasCriSock = await socketExists(CRI_SOCK);

  const commands: Array<{
    name: string;
    tool: string;
    bin: string;
    args: string[];
    env?: NodeJS.ProcessEnv;
    when?: boolean;
  }> = [
    {
      name: "K3s Image Prune (crictl)",
      tool: "crictl",
      bin: "crictl",
      args: ["--runtime-endpoint", `unix://${CRI_SOCK}`, "rmi", "--prune"],
      env: { ...process.env, CRICTL_TIMEOUT },
      when: hasCriSock,
    },
    {
      name: "K3s Image Prune (k3s crictl)",
      tool: "k3s",
      bin: "k3s",
      args: ["crictl", "rmi", "--prune"],
      env: { ...process.env, CRICTL_TIMEOUT },
      when: hasCriSock,
    },
    {
      name: "K3s Containerd Prune (k3s ctr --all)",
      tool: "k3s",
      bin: "k3s",
      args: ["ctr", "-n", "k8s.io", "images", "prune", "--all"],
      when: hasCriSock,
    },
    {
      name: "Docker System Prune",
      tool: "docker",
      bin: "docker",
      args: ["system", "prune", "-af", "--volumes", "--filter", "until=24h"],
      when: hasDockerSock,
    },
    {
      name: "Docker Image Prune",
      tool: "docker",
      bin: "docker",
      args: ["image", "prune", "-af", "--filter", "until=24h"],
      when: hasDockerSock,
    },
    {
      name: "Docker Build Cache Prune",
      tool: "docker",
      bin: "docker",
      args: ["builder", "prune", "-af", "--filter", "until=24h"],
      when: hasDockerSock,
    },
    {
      name: "Container Log Truncation",
      tool: "find",
      bin: "find",
      args: ["/var/lib/docker/containers/", "-name", "*-json.log", "-exec", "truncate", "-s", "0", "{}", ";"],
      when: await pathExists("/var/lib/docker/containers"),
    },
    {
      name: "K3s Containerd Log Truncation",
      tool: "find",
      bin: "find",
      args: ["/var/lib/rancher/k3s/agent/containerd", "-name", "*.log", "-size", "+10M", "-exec", "truncate", "-s", "0", "{}", ";"],
      when: await pathExists("/var/lib/rancher/k3s/agent/containerd"),
    },
    {
      name: "Journal Log Vacuum",
      tool: "journalctl",
      bin: "journalctl",
      args: ["--vacuum-time=2d"],
    },
    {
      name: "Apt Cleanup",
      tool: "apt-get",
      bin: "sh",
      args: ["-c", "apt-get clean && apt-get autoremove -y"],
    },
    {
      name: "Temp File Cleanup",
      tool: "rm",
      bin: "sh",
      args: ["-c", "rm -rf /tmp/* /var/tmp/*"],
    },
  ];

  for (const { name, tool, bin, args, env, when } of commands) {
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
      const { stderr } = await execFileAsync(bin, args, env ? { env } : undefined);
      if (stderr) console.warn(`[STORAGE] [${name}] Warning:`, stderr);
      console.log(`[STORAGE] [${name}] Success.`);
    } catch (error: any) {
      console.error(`[STORAGE] [${name}] Failed:`, error.message);
    }
  }

  try {
    const { stdout } = await execFileAsync("sh", ["-c", "df -h / /var 2>/dev/null || df -h /"]);
    console.log("[STORAGE] Final disk status:\n", stdout);
  } catch (e) {
    // non-fatal
  }

  console.log("[STORAGE] Automated cleanup complete.");
};
