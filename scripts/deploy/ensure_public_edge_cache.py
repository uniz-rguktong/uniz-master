#!/usr/bin/env python3
"""Ensure one Cloudflare cache rule for anonymous public landing reads.

Uses CLOUDFLARE_API_TOKEN from the environment. Never prints the token.
Adds or updates a single rule and leaves every other rule in place.
A failure here must not fail the deploy: main() exits 0 after a warning.
"""

from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request

ZONE_NAME = os.environ.get("ZONE_NAME", "rguktong.in")
RULE_DESCRIPTION = "uniz-public-read-edge-cache"
API = "https://api.cloudflare.com/client/v4"


def expression() -> str:
    landing = " or ".join(
        f'starts_with(http.request.uri.path, "{path}")'
        for path in (
            "/api/home",
            "/api/departments",
            "/api/institute",
            "/api/notifications",
            "/api/academics",
        )
    )
    gateway = " or ".join(
        f'starts_with(http.request.uri.path, "{path}")'
        for path in (
            "/api/v1/cms/api/home",
            "/api/v1/cms/api/departments",
            "/api/v1/cms/api/institute",
            "/api/v1/cms/api/notifications",
            "/api/v1/cms/api/academics",
        )
    )
    return (
        '(http.request.method eq "GET" and '
        'not any(http.request.headers["authorization"][*] ne "") and '
        'not any(http.request.headers["cookie"][*] ne "") and '
        f'((http.host eq "landing-api.rguktong.in" and ({landing})) or '
        f'(http.host eq "api-uniz.rguktong.in" and ({gateway}))))'
    )


def rule_payload() -> dict:
    return {
        "action": "set_cache_settings",
        "expression": expression(),
        "description": RULE_DESCRIPTION,
        "enabled": True,
        "action_parameters": {
            "cache": True,
            "edge_ttl": {"mode": "respect_origin"},
            "browser_ttl": {"mode": "respect_origin"},
        },
    }


def plan(rules: list) -> tuple[str, dict | None]:
    """Return create, update, or noop. Never drops unrelated rules."""
    payload = rule_payload()
    for rule in rules:
        if rule.get("description") != RULE_DESCRIPTION:
            continue
        current = {
            "action": rule.get("action"),
            "expression": rule.get("expression"),
            "description": rule.get("description"),
            "enabled": rule.get("enabled"),
            "action_parameters": rule.get("action_parameters"),
        }
        if current == payload:
            return "noop", rule
        return "update", rule
    return "create", None


def _request(token: str, method: str, url: str, body: dict | None = None) -> tuple[int, dict]:
    data = None if body is None else json.dumps(body).encode()
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Authorization", f"Bearer {token}")
    req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            raw = resp.read().decode()
            return resp.status, json.loads(raw) if raw else {}
    except urllib.error.HTTPError as exc:
        raw = exc.read().decode()
        try:
            parsed = json.loads(raw) if raw else {}
        except json.JSONDecodeError:
            parsed = {}
        return exc.code, parsed


def _warn(status: int, payload: dict) -> None:
    errors = payload.get("errors") if isinstance(payload, dict) else None
    message = ""
    if isinstance(errors, list) and errors:
        message = str(errors[0].get("message") or "")
    print(f"[edge-cache] WARN: Cloudflare API status {status} {message}".rstrip(), file=sys.stderr)


def main() -> int:
    token = os.environ.get("CLOUDFLARE_API_TOKEN") or ""
    if not token.strip():
        print("[edge-cache] CLOUDFLARE_API_TOKEN unset; skipped")
        return 0

    status, zones = _request(token, "GET", f"{API}/zones?name={ZONE_NAME}")
    if status != 200 or not zones.get("success"):
        _warn(status, zones)
        return 0
    result = zones.get("result") or []
    if not result:
        print(f"[edge-cache] WARN: zone {ZONE_NAME} not found", file=sys.stderr)
        return 0
    zone_id = result[0]["id"]

    status, entry = _request(
        token,
        "GET",
        f"{API}/zones/{zone_id}/rulesets/phases/http_request_cache_settings/entrypoint",
    )
    payload = rule_payload()
    if status == 404:
        status, created = _request(
            token,
            "POST",
            f"{API}/zones/{zone_id}/rulesets",
            {
                "name": "Uniz public read cache",
                "kind": "zone",
                "phase": "http_request_cache_settings",
                "rules": [payload],
            },
        )
        if status not in {200, 201} or not created.get("success"):
            _warn(status, created)
            return 0
        print("[edge-cache] Created cache ruleset with uniz-public-read-edge-cache")
        return 0
    if status != 200 or not entry.get("success"):
        _warn(status, entry)
        return 0

    ruleset = entry.get("result") or {}
    ruleset_id = ruleset.get("id")
    rules = list(ruleset.get("rules") or [])
    if not ruleset_id:
        print("[edge-cache] WARN: cache phase has no ruleset id", file=sys.stderr)
        return 0

    action, existing = plan(rules)
    if action == "noop":
        print("[edge-cache] uniz-public-read-edge-cache already matches")
        return 0
    if action == "update":
        rule_id = existing.get("id") if existing else None
        if not rule_id:
            print("[edge-cache] WARN: existing rule has no id", file=sys.stderr)
            return 0
        status, updated = _request(
            token,
            "PATCH",
            f"{API}/zones/{zone_id}/rulesets/{ruleset_id}/rules/{rule_id}",
            payload,
        )
        if status != 200 or not updated.get("success"):
            _warn(status, updated)
            return 0
        print("[edge-cache] Updated uniz-public-read-edge-cache")
        return 0

    status, created = _request(
        token,
        "POST",
        f"{API}/zones/{zone_id}/rulesets/{ruleset_id}/rules",
        payload,
    )
    if status not in {200, 201} or not created.get("success"):
        _warn(status, created)
        return 0
    print("[edge-cache] Added uniz-public-read-edge-cache")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"[edge-cache] WARN: {exc.__class__.__name__}", file=sys.stderr)
        raise SystemExit(0)
