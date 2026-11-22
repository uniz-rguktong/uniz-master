"""Cache-Control for anonymous public landing reads.

Shared caches may store a 2xx GET/HEAD on the public content prefixes when
the request has no Authorization and no Cookie. Everything else is private.
"""

from __future__ import annotations

PUBLIC_PREFIXES = (
    "/api/home",
    "/api/departments",
    "/api/institute",
    "/api/notifications",
    "/api/academics",
)

PUBLIC_CACHE_CONTROL = "public, max-age=0, s-maxage=60, stale-while-revalidate=60"
PRIVATE_CACHE_CONTROL = "private, no-store"


def is_public_read_path(path: str) -> bool:
    path = path.split("?", 1)[0]
    return any(path == prefix or path.startswith(prefix + "/") for prefix in PUBLIC_PREFIXES)


def cache_control_for(
    method: str,
    path: str,
    authorization: str = "",
    cookie: str = "",
    status: int = 200,
    set_cookie: bool = False,
) -> str | None:
    private = bool(authorization.strip() or cookie.strip() or set_cookie)
    if private or method.upper() not in {"GET", "HEAD"}:
        return PRIVATE_CACHE_CONTROL
    if status < 200 or status >= 300:
        return PRIVATE_CACHE_CONTROL
    if is_public_read_path(path):
        return PUBLIC_CACHE_CONTROL
    return None


def vary_header(existing: str) -> str:
    parts: list[str] = []
    for bit in f"{existing}, Authorization, Cookie".split(","):
        item = bit.strip()
        if item and item not in parts:
            parts.append(item)
    return ", ".join(parts)
