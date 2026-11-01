import pytest

from config import get_settings, settings
import models


def test_settings_come_from_the_test_environment():
    assert settings.JWT_ALGORITHM == "HS256"
    assert settings.JWT_SECURITY_KEY == "unit-test-jwt-secret-0123456789ab"
    assert settings.DATABASE_URL.startswith("sqlite+aiosqlite:")
    assert settings.DB_HOST == "example.invalid"
    assert get_settings() is get_settings()


def test_model_table_names():
    assert models.HomePageData.__tablename__ == "home_page_data"
    assert models.InstitutePage.__tablename__ == "institute_pages"
    assert models.AcademicPage.__tablename__ == "academic_pages"
    assert models.Faculty.__tablename__ == "faculty"
    assert models.Notification.__tablename__ == "notifications"


@pytest.mark.asyncio
async def test_get_db_closes_the_session(monkeypatch):
    import database

    closed = {"value": False}

    class Session:
        async def close(self):
            closed["value"] = True

    class CM:
        async def __aenter__(self):
            return Session()

        async def __aexit__(self, *_args):
            return False

    monkeypatch.setattr(database, "AsyncSessionLocal", lambda: CM())
    generator = database.get_db()
    session = await generator.__anext__()
    assert isinstance(session, Session)
    await generator.aclose()
    assert closed["value"] is True
