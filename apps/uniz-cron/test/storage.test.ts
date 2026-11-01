import { beforeEach, describe, expect, it, vi } from "vitest";
import { promisify } from "node:util";

const execMock = vi.hoisted(() => {
  const { promisify: customPromisify } = require("node:util") as typeof import("node:util");
  const fn = vi.fn() as ReturnType<typeof vi.fn> & {
    handler: (cmd: string) => Promise<{ stdout: string; stderr: string }>;
  };
  fn.handler = async () => ({ stdout: "", stderr: "" });
  fn[customPromisify.custom] = (cmd: string) => fn.handler(cmd);
  return fn;
});

const accessMock = vi.hoisted(() => vi.fn(async (_path: string) => {}));

vi.mock("child_process", () => ({ exec: execMock }));
vi.mock("fs/promises", () => ({ access: accessMock }));

const CRI_SOCK = "/run/k3s/containerd/containerd.sock";
const DOCKER_SOCK = "/var/run/docker.sock";
const DOCKER_LOGS = "/var/lib/docker/containers";
const K3S_LOGS = "/var/lib/rancher/k3s/agent/containerd";

const calls: string[] = [];
let tools = new Set<string>();
let paths = new Set<string>();
let failures = new Set<string>();
let stderrFor = new Map<string, string>();

async function loadStorage() {
  const { exec } = await import("child_process");
  if (!vi.isMockFunction(exec)) {
    throw new Error("refusing to run storage cleanup without a mocked exec");
  }
  vi.resetModules();
  calls.length = 0;
  return import("../src/utils/storage");
}

describe("runStorageCleanup", () => {
  beforeEach(() => {
    tools = new Set();
    paths = new Set();
    failures = new Set();
    stderrFor = new Map();
    calls.length = 0;
    delete process.env.CRICTL_TIMEOUT;
    accessMock.mockImplementation(async (target: string) => {
      if (!paths.has(target)) {
        throw Object.assign(new Error("ENOENT"), { code: "ENOENT" });
      }
    });
    execMock.handler = async (cmd: string) => {
      calls.push(cmd);
      if (cmd.startsWith("command -v ")) {
        const tool = cmd.slice("command -v ".length).trim();
        if (!tools.has(tool)) throw new Error(`not found: ${tool}`);
        return { stdout: `/usr/bin/${tool}\n`, stderr: "" };
      }
      if ([...failures].some((prefix) => cmd.startsWith(prefix))) {
        throw new Error(`failed: ${cmd}`);
      }
      return {
        stdout: cmd.startsWith("df ") ? "disk ok\n" : "",
        stderr: stderrFor.get(cmd) || "",
      };
    };
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("skips commands whose sockets, paths, or tools are missing", async () => {
    const { runStorageCleanup } = await loadStorage();
    await runStorageCleanup();

    expect(calls.some((cmd) => cmd.includes("docker"))).toBe(false);
    expect(calls.some((cmd) => cmd.includes("crictl"))).toBe(false);
    expect(calls.some((cmd) => cmd.startsWith("command -v journalctl"))).toBe(true);
    expect(calls.some((cmd) => cmd.startsWith("command -v apt-get"))).toBe(true);
    expect(calls.some((cmd) => cmd.startsWith("command -v rm"))).toBe(true);
    expect(calls.some((cmd) => cmd.startsWith("journalctl"))).toBe(false);
    expect(calls.at(-1)).toBe("df -h / /var 2>/dev/null || df -h /");
    expect(promisify.custom).toBeTypeOf("symbol");
  });

  it("prunes k3s images when the containerd socket and tools exist", async () => {
    process.env.CRICTL_TIMEOUT = "2m";
    paths.add(CRI_SOCK);
    tools = new Set(["crictl", "k3s", "journalctl", "apt-get", "rm"]);
    const { runStorageCleanup } = await loadStorage();
    await runStorageCleanup();

    expect(calls).toContain(
      "CRICTL_TIMEOUT=2m crictl --runtime-endpoint unix:///run/k3s/containerd/containerd.sock rmi --prune",
    );
    expect(calls).toContain("CRICTL_TIMEOUT=2m k3s crictl rmi --prune");
    expect(calls).toContain("k3s ctr -n k8s.io images prune --all");
  });

  it("prunes docker, truncates logs, and warns on stderr", async () => {
    paths = new Set([DOCKER_SOCK, DOCKER_LOGS, K3S_LOGS]);
    tools = new Set(["docker", "find", "journalctl", "apt-get", "rm"]);
    const dockerPrune =
      'docker system prune -af --volumes --filter "until=24h"';
    stderrFor.set(dockerPrune, "reclaimed 1GB");
    const { runStorageCleanup } = await loadStorage();
    await runStorageCleanup();

    expect(calls).toContain(dockerPrune);
    expect(calls).toContain('docker image prune -af --filter "until=24h"');
    expect(calls).toContain('docker builder prune -af --filter "until=24h"');
    expect(calls).toContain(
      "find /var/lib/docker/containers/ -name '*-json.log' -exec truncate -s 0 {} \\;",
    );
    expect(calls).toContain(
      "find /var/lib/rancher/k3s/agent/containerd -name '*.log' -size +10M -exec truncate -s 0 {} \\;",
    );
    expect(console.warn).toHaveBeenCalledWith(
      "[STORAGE] [Docker System Prune] Warning:",
      "reclaimed 1GB",
    );
  });

  it("continues after a command fails and treats df as non-fatal", async () => {
    tools = new Set(["journalctl", "apt-get", "rm"]);
    failures.add("apt-get clean");
    const { runStorageCleanup } = await loadStorage();
    await expect(runStorageCleanup()).resolves.toBeUndefined();
    expect(console.error).toHaveBeenCalledWith(
      "[STORAGE] [Apt Cleanup] Failed:",
      expect.stringContaining("apt-get clean"),
    );
    expect(calls.at(-1)).toContain("df -h");

    failures.add("df ");
    const again = await loadStorage();
    await expect(again.runStorageCleanup()).resolves.toBeUndefined();
  });

  it("uses the default crictl timeout", async () => {
    paths.add(CRI_SOCK);
    tools.add("crictl");
    const { runStorageCleanup } = await loadStorage();
    await runStorageCleanup();
    expect(calls).toContain(
      "CRICTL_TIMEOUT=10m crictl --runtime-endpoint unix:///run/k3s/containerd/containerd.sock rmi --prune",
    );
  });
});
