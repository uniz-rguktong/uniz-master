"""Current public copy for home fields that used to be hardcoded.

Null database values are filled from these defaults. A value that is already
stored is left unchanged.
"""

from typing import Optional

DEFAULT_HERO = {
    "eyebrow": "Ongole Campus",
    "title": "Rajiv Gandhi University of Knowledge Technologies",
    "subtitle": "Catering to the Educational Needs of Gifted Rural Youth",
}

DEFAULT_CONTACT = {
    "address": (
        "Rajiv Gandhi University of Knowledge Technologies, Ongole. "
        "RGUKT Ongole Campus, Kurnool Road, Santhanuthalapadu (V&M), "
        "Prakasam District, Andhra Pradesh — 523225."
    ),
    "phone": "08592-223133",
    "email": "director@rguktong.ac.in",
}


def _copy_block(value, defaults: dict) -> dict:
    raw = value if isinstance(value, dict) else {}
    resolved = {}
    for key, fallback in defaults.items():
        current = raw.get(key, None)
        resolved[key] = current if isinstance(current, str) else fallback
    return resolved


def resolve_hero(value) -> dict:
    return _copy_block(value, DEFAULT_HERO)


def resolve_contact(value) -> dict:
    return _copy_block(value, DEFAULT_CONTACT)


def merge_block(existing, incoming: Optional[dict], resolver) -> dict:
    """Keep the stored block when the client omits it. Partial writes overlay."""
    if incoming is None:
        return resolver(existing)
    base = existing if isinstance(existing, dict) else {}
    return resolver({**base, **incoming})


def notification_read_categories(category: str) -> list:
    """The public site reads news_updates. An older editor saved newsupdates."""
    if category in ("news_updates", "newsupdates"):
        return ["news_updates", "newsupdates"]
    return [category]


def notification_write_category(category: str) -> str:
    if category == "newsupdates":
        return "news_updates"
    return category
