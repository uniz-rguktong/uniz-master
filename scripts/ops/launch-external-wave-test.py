#!/usr/bin/env python3
"""
External wave load test — run from YOUR laptop/CI, NOT the VPS.

Simulates WhatsApp-spike patterns: many clients hit the public internet
endpoints (portal → sign-in → API) in rising waves.

Usage:
  # Waves only (no login token needed):
  python3 scripts/launch-external-wave-test.py

  # Include post-login reads (most realistic after sign-in):
  TOKEN='eyJ...' python3 scripts/launch-external-wave-test.py

  # Custom waves (concurrent clients per wave):
  WAVES=150,400,800 python3 scripts/launch-external-wave-test.py

  # Custom health path (default aggregate probe):
  HEALTH_PATH=/system/health python3 scripts/launch-external-wave-test.py

  # Liveness-only probe (sub-ms gateway, no upstream fan-out):
  HEALTH_PATH=/system/health/live python3 scripts/launch-external-wave-test.py

  # Pause between waves (seconds):
  WAVE_PAUSE=45 python3 scripts/launch-external-wave-test.py
"""
from __future__ import annotations

import concurrent.futures
import json
import os
import ssl
import statistics
import sys
import time
import urllib.error
import urllib.request
from dataclasses import dataclass, field
from typing import Callable

PORTAL = os.environ.get("PORTAL_URL", "https://uniz.rguktong.in").rstrip("/")
API = os.environ.get("API_URL", "https://api-uniz.rguktong.in/api/v1").rstrip("/")
WAVES = [int(x) for x in os.environ.get("WAVES", "150,400,800").split(",") if x.strip()]
WAVE_PAUSE = int(os.environ.get("WAVE_PAUSE", "30"))
WAVE_DURATION = int(os.environ.get("WAVE_DURATION", "45"))
SLOW_P95_MS = int(os.environ.get("SLOW_P95_MS", "500"))
HEALTH_PATH = os.environ.get("HEALTH_PATH", "/system/health").strip()
TOKEN = os.environ.get("TOKEN", "").strip()
VERIFY_SSL = os.environ.get("VERIFY_SSL", "1").strip() not in ("0", "false", "no")
CTX = ssl.create_default_context()
if not VERIFY_SSL:
    CTX.check_hostname = False
    CTX.verify_mode = ssl.CERT_NONE


@dataclass
class WaveStats:
    name: str
    total: int = 0
    ok: int = 0
    errors: int = 0
    latencies_ms: list[float] = field(default_factory=list)
    status_counts: dict[int, int] = field(default_factory=dict)

    def record(self, ms: float | None, status: int | None, err: str | None) -> None:
        self.total += 1
        if err:
            self.errors += 1
            return
        if status is not None:
            self.status_counts[status] = self.status_counts.get(status, 0) + 1
        if ms is not None and status is not None and 200 <= status < 500:
            self.ok += 1
            self.latencies_ms.append(ms)
        elif ms is not None and status is not None and status >= 500:
            self.errors += 1
        elif status is not None and status < 200:
            self.errors += 1

    def report(self) -> str:
        if not self.latencies_ms:
            return f"  {self.name:28} n={self.total:5} ok=0 err={self.errors} (no successful samples)"
        self.latencies_ms.sort()
        p50 = self.latencies_ms[len(self.latencies_ms) // 2]
        p95 = self.latencies_ms[max(0, int(len(self.latencies_ms) * 0.95) - 1)]
        avg = statistics.mean(self.latencies_ms)
        mx = max(self.latencies_ms)
        rps = len(self.latencies_ms) / max(WAVE_DURATION, 1)
        flag = "SLOW" if p95 > SLOW_P95_MS else "OK"
        top = dict(sorted(self.status_counts.items(), key=lambda x: -x[1])[:4])
        return (
            f"  {self.name:28} n={self.total:5} ok={self.ok:5} err={self.errors:4} "
            f"rps={rps:5.1f} avg={avg:6.0f}ms p50={p50:6.0f}ms p95={p95:6.0f}ms max={mx:6.0f}ms "
            f"codes={top} {flag}"
        )


UA = os.environ.get(
    "USER_AGENT",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
)


def http_call(
    method: str,
    url: str,
    *,
    data: bytes | None = None,
    headers: dict[str, str] | None = None,
    timeout: float = 30,
) -> tuple[float | None, int | None, str | None]:
    hdrs = {"User-Agent": UA, "Accept": "*/*"}
    if headers:
        hdrs.update(headers)
    req = urllib.request.Request(url, data=data, method=method, headers=hdrs)
    t0 = time.perf_counter()
    try:
        with urllib.request.urlopen(req, timeout=timeout, context=CTX) as resp:
            resp.read(8192)
            ms = (time.perf_counter() - t0) * 1000
            return ms, resp.status, None
    except urllib.error.HTTPError as e:
        ms = (time.perf_counter() - t0) * 1000
        try:
            e.read(2048)
        except Exception:
            pass
        return ms, e.code, None
    except Exception as e:
        return None, None, str(e)[:80]


def run_pool(
    concurrency: int,
    duration: int,
    worker: Callable[[int], tuple[float | None, int | None, str | None]],
    stats: WaveStats,
) -> None:
    deadline = time.time() + duration
    with concurrent.futures.ThreadPoolExecutor(max_workers=concurrency) as ex:
        futs: list[concurrent.futures.Future] = []
        i = 0
        while time.time() < deadline:
            while len(futs) < concurrency and time.time() < deadline:
                idx = i
                i += 1
                futs.append(ex.submit(worker, idx))
            done, pending = concurrent.futures.wait(
                futs, timeout=0.4, return_when=concurrent.futures.FIRST_COMPLETED
            )
            for f in done:
                stats.record(*f.result())
            futs = list(pending)


def wave_portal_click(stats: WaveStats, idx: int) -> tuple[float | None, int | None, str | None]:
  # Student opens WhatsApp link → landing/sign-in
    url = f"{PORTAL}/student/signin" if idx % 2 else PORTAL + "/"
    return http_call("GET", url)


def wave_login_attempt(stats: WaveStats, idx: int) -> tuple[float | None, int | None, str | None]:
    # Realistic payload; captcha fails in prod without browser — still loads auth+gateway
    user = f"o21{(idx % 900) + 100:04d}"
    body = json.dumps(
        {
            "username": user,
            "password": f"{user.lower()}@rguktong",
            "captchaToken": "external-load-test-no-captcha",
        }
    ).encode()
    return http_call(
        "POST",
        f"{API}/auth/login/student",
        data=body,
        headers={"Content-Type": "application/json"},
    )


def wave_health(stats: WaveStats, idx: int) -> tuple[float | None, int | None, str | None]:
    path = HEALTH_PATH if HEALTH_PATH.startswith("/") else f"/{HEALTH_PATH}"
    return http_call("GET", f"{API}{path}")


def wave_authenticated_reads(stats: WaveStats, idx: int) -> tuple[float | None, int | None, str | None]:
    paths = [
        "/profile/student/me",
        "/academics/grades",
        "/academics/attendance",
    ]
    path = paths[idx % len(paths)]
    headers = {"Authorization": f"Bearer {TOKEN}"}
    return http_call("GET", f"{API}{path}", headers=headers)


def check_health() -> bool:
    path = HEALTH_PATH if HEALTH_PATH.startswith("/") else f"/{HEALTH_PATH}"
    ms, code, err = http_call("GET", f"{API}{path}")
    if err or code != 200:
        print(f"ABORT: API health failed code={code} err={err}")
        return False
    print(f"Pre-flight API health OK ({ms:.0f}ms)")
    return True


def main() -> int:
    print("=" * 72)
    print("UniZ EXTERNAL wave load test (clients outside VPS)")
    print(f"  portal: {PORTAL}")
    print(f"  api:    {API}")
    print(f"  waves:  {WAVES} concurrent × {WAVE_DURATION}s, pause {WAVE_PAUSE}s")
    print(f"  token:  {'set (authenticated reads enabled)' if TOKEN else 'not set (login-static only)'}")
    print(f"  health: {HEALTH_PATH} (SLOW if p95 > {SLOW_P95_MS}ms)")
    print("=" * 72)

    if not check_health():
        return 1

    scenarios: list[tuple[str, Callable]] = [
        ("portal_click", wave_portal_click),
        ("login_attempt", wave_login_attempt),
        ("api_health", wave_health),
    ]
    if TOKEN:
        scenarios.append(("auth_reads", wave_authenticated_reads))

    all_reports: list[str] = []

    for wave_num, concurrency in enumerate(WAVES, 1):
        print(f"\n{'─' * 72}")
        print(f"WAVE {wave_num}/{len(WAVES)} — {concurrency} concurrent clients for {WAVE_DURATION}s")
        print(f"{'─' * 72}")

        for name, fn in scenarios:
            stats = WaveStats(name=f"w{wave_num}_{name}")
            print(f"  → {name} ...", flush=True)

            def worker(idx: int, f=fn) -> tuple[float | None, int | None, str | None]:
                return f(stats, idx)

            run_pool(concurrency, WAVE_DURATION, worker, stats)
            line = stats.report()
            print(line)
            all_reports.append(line)

        if wave_num < len(WAVES):
            print(f"\n  (pause {WAVE_PAUSE}s — simulating gap between WhatsApp waves)")
            time.sleep(WAVE_PAUSE)

    print(f"\n{'=' * 72}")
    print("SUMMARY")
    print("=" * 72)
    for line in all_reports:
        print(line)

    print(
        "\nNotes:"
        "\n  • Run from laptop/home network — not VPS — to include real internet + Cloudflare path."
        "\n  • External RTT (home network → Cloudflare → VPS) often dominates p95; "
        "server-side cache/warm replicas help most on health + portal."
        "\n  • HEALTH_PATH=/system/health/live tests liveness only (no upstream probes)."
        "\n  • login_attempt uses invalid captcha (expected 400) but still stresses auth/gateway."
        "\n  • For true post-login peak, set TOKEN from one browser login:"
        "\n      TOKEN='...' python3 scripts/launch-external-wave-test.py"
        "\n  • login_attempt codes: 400=captcha/rate-limit, 401=bad creds, 429=throttled"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
