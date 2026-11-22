import os
import sys
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path

BACKEND = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND))

_fd, _db_path = tempfile.mkstemp(prefix="uniz-home-", suffix=".db")
os.close(_fd)
os.environ["DATABASE_URL"] = f"sqlite+aiosqlite:///{_db_path}"
os.environ["JWT_SECURITY_KEY"] = "test-preview-secret"
os.environ["JWT_ALGORITHM"] = "HS256"
os.environ["DUMMY_TOKEN"] = "dummy"
os.environ["DB_USER"] = "user"
os.environ["DB_PASS"] = "pass"
os.environ["DB_HOST"] = "localhost"
os.environ["DB_PORT"] = "5432"
os.environ["DB_NAME"] = "uniz"

import jwt
from fastapi.testclient import TestClient
from content_defaults import DEFAULT_CONTACT, DEFAULT_HERO, merge_block, resolve_hero
from main import app

client = TestClient(app)
client.__enter__()


def token(**claims):
    now = datetime.now(timezone.utc)
    payload = {"iat": now, "exp": now + timedelta(hours=2)}
    payload.update(claims)
    return jwt.encode(payload, os.environ["JWT_SECURITY_KEY"], algorithm="HS256")


def auth(value):
    return {"Authorization": f"Bearer {value}"}


class HomeContentTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        response = client.get("/api/home/")
        cls.initial_status = response.status_code
        cls.initial = response.json()

    def test_public_home_uses_seeded_copy_without_a_draft_flag(self):
        self.assertEqual(self.initial_status, 200)
        body = self.initial
        self.assertEqual(body["hero"]["title"], DEFAULT_HERO["title"])
        self.assertEqual(body["hero"]["subtitle"], DEFAULT_HERO["subtitle"])
        self.assertEqual(body["contact"]["phone"], DEFAULT_CONTACT["phone"])
        self.assertEqual(body["contact"]["email"], DEFAULT_CONTACT["email"])
        self.assertNotIn("draft", body)

    def test_omitted_hero_is_kept_when_other_fields_publish(self):
        webadmin = token(username="webadmin", role="webadmin")
        edited = client.put(
            "/api/home/",
            headers=auth(webadmin),
            json={"hero": {"eyebrow": "Ongole Campus", "title": "Edited campus title", "subtitle": "Edited subtitle"}},
        )
        self.assertEqual(edited.status_code, 200, edited.text)
        self.assertEqual(edited.json()["hero"]["title"], "Edited campus title")

        kept = client.put(
            "/api/home/",
            headers=auth(webadmin),
            json={"announcements": [{"text": "Ticker line", "link": None}]},
        )
        self.assertEqual(kept.status_code, 200, kept.text)
        body = kept.json()
        self.assertEqual(body["hero"]["title"], "Edited campus title")
        self.assertEqual(body["announcements"][0]["text"], "Ticker line")
        self.assertEqual(body["contact"]["address"], DEFAULT_CONTACT["address"])

    def test_partial_hero_does_not_wipe_stored_title(self):
        merged = merge_block(
            {"eyebrow": "Ongole Campus", "title": "Stored title", "subtitle": "Stored subtitle"},
            {"eyebrow": "Campus"},
            resolve_hero,
        )
        self.assertEqual(merged["title"], "Stored title")
        self.assertEqual(merged["eyebrow"], "Campus")


class PreviewAuthTests(unittest.TestCase):
    def test_preview_requires_a_webadmin_token(self):
        missing = client.get("/api/preview/session")
        self.assertEqual(missing.status_code, 401)

        query = client.get("/api/preview/session?token=not-a-header")
        self.assertEqual(query.status_code, 401)

        forged = client.get("/api/preview/session", headers=auth("not-a-jwt"))
        self.assertEqual(forged.status_code, 401)

        dean = client.get(
            "/api/preview/session",
            headers=auth(token(username="dean", role="dean", email="dean@rguktong.ac.in")),
        )
        self.assertEqual(dean.status_code, 403)

        other = client.get(
            "/api/preview/session",
            headers=auth(token(username="mallikarjuna", role="webadmin", email="mallikarjuna@rguktong.ac.in")),
        )
        self.assertEqual(other.status_code, 403)

        expired = jwt.encode(
            {
                "username": "webadmin",
                "role": "webadmin",
                "exp": datetime.now(timezone.utc) - timedelta(minutes=5),
            },
            os.environ["JWT_SECURITY_KEY"],
            algorithm="HS256",
        )
        stale = client.get("/api/preview/session", headers=auth(expired))
        self.assertEqual(stale.status_code, 401)

        allowed = client.get(
            "/api/preview/session",
            headers=auth(token(username="webadmin", role="webadmin")),
        )
        self.assertEqual(allowed.status_code, 200)
        self.assertEqual(allowed.json(), {"ok": True, "role": "webadmin"})
        self.assertNotIn("token", allowed.json())


class PublicCacheHeaderTests(unittest.TestCase):
    def test_anonymous_public_reads_are_edge_cacheable(self):
        home = client.get("/api/home/")
        self.assertEqual(home.status_code, 200)
        self.assertEqual(
            home.headers["cache-control"],
            "public, max-age=0, s-maxage=60, stale-while-revalidate=60",
        )
        self.assertIn("Authorization", home.headers["vary"])
        self.assertIn("Cookie", home.headers["vary"])

        notes = client.get("/api/notifications/?type=news_updates")
        self.assertEqual(notes.status_code, 200)
        self.assertIn("s-maxage=60", notes.headers["cache-control"])

    def test_authorization_and_cookies_are_not_cached(self):
        webadmin = token(username="webadmin", role="webadmin")
        authed = client.get("/api/home/", headers=auth(webadmin))
        self.assertEqual(authed.headers["cache-control"], "private, no-store")

        cookied = client.get("/api/home/", headers={"Cookie": "session=1"})
        self.assertEqual(cookied.headers["cache-control"], "private, no-store")

        write = client.put(
            "/api/home/",
            headers=auth(webadmin),
            json={"announcements": [{"text": "Cache check", "link": None}]},
        )
        self.assertEqual(write.status_code, 200, write.text)
        self.assertEqual(write.headers["cache-control"], "private, no-store")

    def test_missing_and_private_routes_are_not_public(self):
        missing = client.get("/api/institute/does-not-exist")
        self.assertEqual(missing.status_code, 404)
        self.assertEqual(missing.headers["cache-control"], "private, no-store")

        preview = client.get("/api/preview/session")
        self.assertEqual(preview.status_code, 401)
        self.assertEqual(preview.headers["cache-control"], "private, no-store")

        health = client.get("/health")
        self.assertEqual(health.status_code, 200)
        self.assertNotIn("s-maxage", health.headers.get("cache-control", ""))


class NotificationAliasTests(unittest.TestCase):
    def test_old_news_key_is_readable_as_news_updates(self):
        webadmin = token(username="webadmin", role="webadmin")
        saved = client.put(
            "/api/notifications/?type=newsupdates",
            headers=auth(webadmin),
            json=[{"title": "Campus notice", "date": "21-11-2026", "links": []}],
        )
        self.assertEqual(saved.status_code, 200, saved.text)

        current = client.get("/api/notifications/?type=news_updates")
        self.assertEqual(current.status_code, 200)
        self.assertEqual(current.json()[0]["title"], "Campus notice")

        legacy = client.get("/api/notifications/?type=newsupdates")
        self.assertEqual(legacy.json()[0]["title"], "Campus notice")

        replaced = client.put(
            "/api/notifications/?type=news_updates",
            headers=auth(webadmin),
            json=[{"title": "Replacement notice", "date": "21-11-2026", "links": []}],
        )
        self.assertEqual(replaced.status_code, 200, replaced.text)
        titles = [item["title"] for item in client.get("/api/notifications/?type=news_updates").json()]
        self.assertEqual(titles, ["Replacement notice"])


def tearDownModule():
    client.__exit__(None, None, None)
    try:
        os.remove(_db_path)
    except OSError:
        pass


if __name__ == "__main__":
    unittest.main()
