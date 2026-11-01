from unittest.mock import AsyncMock, MagicMock

from fastapi.testclient import TestClient


def _patch_engine():
    import database

    connection = MagicMock()
    connection.run_sync = AsyncMock()

    class Begin:
        async def __aenter__(self):
            return connection

        async def __aexit__(self, *_args):
            return False

    class Engine:
        def begin(self):
            return Begin()

        async def dispose(self):
            self.disposed = True

    engine = Engine()
    engine.dispose = AsyncMock()
    database.engine = engine
    return engine


def test_health_root_and_cors_do_not_open_a_database():
    engine = _patch_engine()
    from main import app

    with TestClient(app) as client:
        health = client.get("/health", headers={"Origin": "https://rguktong.in"})
        assert health.status_code == 200
        assert health.json() == {"status": "healthy", "service": "Uniz Landing Page API"}
        assert health.headers["access-control-allow-origin"] == "https://rguktong.in"

        root = client.get("/", headers={"Origin": "https://evil.example"})
        assert root.status_code == 200
        assert "Database-Backed College API" in root.text
        assert "access-control-allow-origin" not in root.headers

        local = client.get("/health", headers={"Origin": "http://127.0.0.1:5173"})
        assert local.headers["access-control-allow-origin"] == "http://127.0.0.1:5173"

        blocked = client.put("/api/home/", json={"announcements": [], "stats": [], "images": []})
        assert blocked.status_code in (401, 403)

    engine.dispose.assert_awaited()
