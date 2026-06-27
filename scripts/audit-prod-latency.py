#!/usr/bin/env python3
"""Production API latency audit — run on VPS or anywhere with api access."""
import json
import ssl
import time
import urllib.error
import urllib.request

BASE = "https://api-uniz.rguktong.in/api/v1"
CTX = ssl.create_default_context()
RUNS = 5
SLOW_MS = 500


def measure(url, method="GET", runs=RUNS):
    times = []
    status = err = None
    for _ in range(runs):
        req = urllib.request.Request(url, method=method)
        t0 = time.perf_counter()
        try:
            with urllib.request.urlopen(req, timeout=30, context=CTX) as r:
                r.read(1024)
                status = r.status
        except urllib.error.HTTPError as e:
            status = e.code
            e.read(256)
        except Exception as e:
            err = str(e)[:100]
            break
        times.append((time.perf_counter() - t0) * 1000)
    if not times:
        return {"avg": None, "p95": None, "status": status, "err": err}
    times.sort()
    p95 = times[max(0, int(len(times) * 0.95) - 1)]
    return {
        "avg": round(sum(times) / len(times)),
        "p95": round(p95),
        "min": round(min(times)),
        "max": round(max(times)),
        "status": status,
    }


def flag(ms):
    if ms is None:
        return "ERR"
    return "SLOW" if ms > SLOW_MS else "OK"


print("=== /system/health service breakdown (gateway internal probe) ===")
try:
    with urllib.request.urlopen(BASE + "/system/health", timeout=30, context=CTX) as r:
        data = json.loads(r.read())
    cached = data.get("cached", False)
    print(f"  platform: {data.get('status')}  cached={cached}")
    for s in sorted(
        data.get("services", []),
        key=lambda x: float(str(x.get("latency", "0")).replace("ms", "") or 0),
        reverse=True,
    ):
        lat = s.get("latency", s.get("error", "n/a"))
        ms = float(str(lat).replace("ms", "")) if isinstance(lat, str) and "ms" in str(lat) else 0
        print(f"  {s['name']:15} {s.get('status', '?'):10} {str(lat):>12}  {flag(ms)}")
except Exception as e:
    print(f"  FAILED: {e}")

services = [
    ("auth", "/auth/health"),
    ("profile", "/profile/health"),
    ("cms", "/cms/health"),
    ("academics", "/academics/health"),
    ("requests", "/requests/health"),
    ("files", "/files/health"),
    ("mail", "/mail/health"),
    ("notifications", "/notifications/health"),
    ("cron", "/cron/health"),
    ("grievance", "/grievance/health"),
    ("docs", "/docs/"),
]

print(f"\n=== Gateway-routed probes ({RUNS} runs each, ms) ===")
rows = []
for name, path in services:
    m = measure(BASE + path)
    rows.append((name, path, m))
rows.sort(key=lambda x: x[2].get("p95") or 9999, reverse=True)
for name, path, m in rows:
    if m.get("err"):
        print(f"  {name:15} {path:28} ERROR {m['err']}")
    else:
        print(
            f"  {name:15} {path:28} avg={m['avg']:4} p95={m['p95']:4} "
            f"min={m['min']:4} max={m['max']:4} {flag(m['p95'])}"
        )

public = [
    ("system/health", "/system/health"),
    ("cms/banners/public", "/cms/banners/public"),
    ("cms/notifications", "/cms/notifications"),
    ("portal (uniz)", "https://uniz.rguktong.in/"),
    ("landing-api", "https://landing-api.rguktong.in/"),
]

print(f"\n=== Public / edge endpoints ({RUNS} runs) ===")
for name, path in public:
    url = path if path.startswith("http") else BASE + path
    m = measure(url)
    if m.get("err"):
        print(f"  {name:22} ERROR {m['err']}")
    else:
        print(f"  {name:22} avg={m['avg']:4} p95={m['p95']:4} {flag(m['p95'])}")

print("\n=== Health cache (3 sequential calls) ===")
for i in range(3):
    m = measure(BASE + "/system/health", runs=1)
    print(f"  call {i+1}: {m.get('avg')}ms")
