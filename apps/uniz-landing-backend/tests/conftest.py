import os

os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///:memory:"
os.environ["JWT_SECURITY_KEY"] = "unit-test-jwt-secret-0123456789ab"
os.environ["JWT_ALGORITHM"] = "HS256"
os.environ["DUMMY_TOKEN"] = "unit-test-dummy-token"
os.environ["DB_USER"] = "unit"
os.environ["DB_PASS"] = "unit-pass"
os.environ["DB_HOST"] = "example.invalid"
os.environ["DB_PORT"] = "5432"
os.environ["DB_NAME"] = "unit_db"

import pytest


class _Session:
    async def close(self):
        return None

    async def execute(self, *_args, **_kwargs):
        raise AssertionError("unexpected database execute")

    async def commit(self):
        raise AssertionError("unexpected database commit")

    async def rollback(self):
        return None

    async def refresh(self, _obj):
        return None

    def add(self, *_args, **_kwargs):
        raise AssertionError("unexpected database add")

    def add_all(self, *_args, **_kwargs):
        raise AssertionError("unexpected database add_all")


class _SessionCM:
    async def __aenter__(self):
        return _Session()

    async def __aexit__(self, *_args):
        return False


@pytest.fixture(autouse=True)
def _no_real_db(monkeypatch):
    import database

    monkeypatch.setattr(database, "AsyncSessionLocal", lambda: _SessionCM())
