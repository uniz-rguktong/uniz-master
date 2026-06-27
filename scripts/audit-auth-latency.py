#!/usr/bin/env python3
"""Authenticated student API latency audit (production).

Requires JWT in TOKEN env (see docs/SUB_500MS_ACTION_PLAN.md).

  export TOKEN='...'   # from localStorage student_token or mint-student-token.sh
  export STUDENT_USER=O210008
  python3 scripts/audit-auth-latency.py
  python3 scripts/audit-auth-latency.py --json > /tmp/auth-latency.json
"""
from __future__ import annotations

import argparse
import json
import os
import ssl
import sys
import time
import urllib.error
import urllib.request

BASE = os.environ.get("BASE_URL", "https://api-uniz.rguktong.in/api/v1").rstrip("/")
TOKEN = os.environ.get("TOKEN", "").strip()
STUDENT = os.environ.get("STUDENT_USER", "O210008").upper()
DEFAULT_RUNS = int(os.environ.get("RUNS", "5"))
SLOW_MS = int(os.environ.get("SLOW_MS", "500"))
CTX = ssl.create_default_context()
if os.environ.get("INSECURE_SSL", "").lower() in ("1", "true", "yes"):
    CTX.check_hostname = False
    CTX.verify_mode = ssl.CERT_NONE


def measure(
    method: str, path: str, body: dict | None = None, runs: int = DEFAULT_RUNS
) -> dict:
    url = path if path.startswith("http") else f"{BASE}{path}"
    times: list[float] = []
    status = err = None
    headers = auth_headers()
    if body is not None:
        headers["Content-Type"] = "application/json"
        data = json.dumps(body).encode()
    else:
        data = None

    for _ in range(runs):
        req = urllib.request.Request(url, data=data, method=method, headers=headers)
        t0 = time.perf_counter()
        try:
            with urllib.request.urlopen(req, timeout=60, context=CTX) as r:
                r.read(8192)
                status = r.status
        except urllib.error.HTTPError as e:
            status = e.code
            e.read(512)
        except Exception as e:
            err = str(e)[:120]
            break
        times.append((time.perf_counter() - t0) * 1000)

    if not times:
        return {"avg": None, "p95": None, "status": status, "err": err}
    times.sort()
    p95 = times[max(0, int(len(times) * 0.95) - 1)]
    return {
        "avg": round(sum(times) / len(times)),
        "p50": round(times[len(times) // 2]),
        "p95": round(p95),
        "min": round(min(times)),
        "max": round(max(times)),
        "status": status,
    }


def flag(ms: int | None) -> str:
    if ms is None:
        return "ERR"
    return "SLOW" if ms > SLOW_MS else "OK"


def auth_headers() -> dict[str, str]:
    return {
        "Authorization": f"Bearer {TOKEN}",
        "User-Agent": "uniz-latency-audit/1.0",
        "Accept": "application/json",
    }


def bootstrap() -> dict:
    """Fetch profile to resolve dynamic route params."""
    req = urllib.request.Request(
        f"{BASE}/profile/student/me",
        headers=auth_headers(),
    )
    with urllib.request.urlopen(req, timeout=30, context=CTX) as r:
        data = json.loads(r.read())
    s = data.get("student") or data
    branch = s.get("branch") or "CSE"
    year = s.get("year") or "E4"
    user = (s.get("username") or STUDENT).upper()
    sem = "E4S1"
    try:
        greq = urllib.request.Request(
            f"{BASE}/academics/grades",
            headers=auth_headers(),
        )
        with urllib.request.urlopen(greq, timeout=30, context=CTX) as gr:
            gd = json.loads(gr.read())
            grades = gd.get("grades") or []
            if grades:
                sem = grades[0].get("semesterId") or sem
    except Exception:
        pass
    return {"branch": branch, "year": year, "user": user, "semester": sem}


def main() -> int:
    parser = argparse.ArgumentParser(description="Authenticated student API latency audit")
    parser.add_argument("--json", action="store_true", help="JSON output")
    parser.add_argument("--runs", type=int, default=DEFAULT_RUNS)
    args = parser.parse_args()
    runs = args.runs

    if not TOKEN:
        print("ERROR: Set TOKEN (see docs/SUB_500MS_ACTION_PLAN.md)", file=sys.stderr)
        print("  Browser: localStorage student_token on uniz.rguktong.in", file=sys.stderr)
        return 1

    # Validate token
    try:
        ctx = bootstrap()
    except urllib.error.HTTPError as e:
        print(f"ERROR: Token invalid or expired (HTTP {e.code})", file=sys.stderr)
        return 1
    except Exception as e:
        print(f"ERROR: bootstrap failed: {e}", file=sys.stderr)
        return 1

    static_routes: list[tuple[str, str, dict | None]] = [
        ("GET", "/profile/student/bootstrap", None),
        ("GET", "/profile/student/me", None),
        ("GET", "/academics/grades", None),
        ("GET", "/academics/attendance", None),
        ("GET", "/academics/seating/student", None),
        ("GET", f"/academics/student/current/{ctx['user']}", None),
        ("GET", "/requests/history", None),
        ("GET", "/requests/outside", None),
        ("GET", "/requests/grievance/list", None),
        ("GET", "/cms/banners/public", None),
        ("GET", "/cms/notifications", None),
        ("GET", "/system/health", None),
    ]

    dynamic_routes: list[tuple[str, str, dict | None]] = [
        (
            "GET",
            f"/academics/student/available?branch={ctx['branch']}&year={ctx['year']}",
            None,
        ),
        ("GET", f"/academics/grades/download/{ctx['semester']}", None),
        ("GET", f"/academics/attendance/download/{ctx['semester']}", None),
    ]

    all_routes = static_routes + dynamic_routes
    results = []
    for method, path, body in all_routes:
        m = measure(method, path, body, runs=runs)
        results.append({"method": method, "path": path, **m})

    results.sort(key=lambda x: x.get("p95") or 99999, reverse=True)
    slow = [r for r in results if (r.get("p95") or 0) > SLOW_MS]

    if args.json:
        print(
            json.dumps(
                {
                    "base": BASE,
                    "student": ctx["user"],
                    "runs": runs,
                    "slow_threshold_ms": SLOW_MS,
                    "routes": results,
                    "slow_count": len(slow),
                },
                indent=2,
            )
        )
        return 0

    print(f"=== Authenticated latency audit ({runs} runs, p95 target {SLOW_MS}ms) ===")
    print(f"  student: {ctx['user']}  branch: {ctx['branch']}  year: {ctx['year']}  sem: {ctx['semester']}")
    print(f"{'METHOD':6} {'PATH':42} {'p50':>6} {'p95':>6} {'max':>6} {'HTTP':>4} {'FLAG'}")
    print("-" * 90)
    for r in results:
        if r.get("err"):
            print(f"{r['method']:6} {r['path']:42} ERROR {r['err']}")
        else:
            print(
                f"{r['method']:6} {r['path']:42} {r.get('p50', '-'):>6} {r.get('p95', '-'):>6} "
                f"{r.get('max', '-'):>6} {r.get('status', '-'):>4} {flag(r.get('p95'))}"
            )

    print(f"\n=== Summary: {len(slow)}/{len(results)} routes SLOW (p95 > {SLOW_MS}ms) ===")
    for r in slow:
        print(f"  SLOW  {r['method']} {r['path']}  p95={r.get('p95')}ms")

    return 1 if slow else 0


if __name__ == "__main__":
    sys.exit(main())
