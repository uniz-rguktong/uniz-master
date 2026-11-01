from pathlib import Path

import pytest

import migrate


def test_migrate_stops_when_the_token_is_missing(monkeypatch):
    monkeypatch.setattr(migrate, "TOKEN", "")
    with pytest.raises(SystemExit):
        migrate.migrate_data()


def test_migrate_copies_each_collection_without_calling_the_network(monkeypatch):
    gets = []
    puts = []

    class Response:
        status_code = 200

        def json(self):
            return {"ok": True}

    def fake_get(url, params=None):
        gets.append((url, params))
        return Response()

    def fake_put(url, params=None, json=None, headers=None):
        puts.append((url, params, headers, json))
        return Response()

    monkeypatch.setattr(migrate, "TOKEN", "unit-token")
    monkeypatch.setattr(migrate.requests, "get", fake_get)
    monkeypatch.setattr(migrate.requests, "put", fake_put)

    migrate.migrate_data()

    expected = (
        1
        + len(migrate.INSTITUTE_PAGES)
        + len(migrate.ACADEMIC_PAGES)
        + len(migrate.NOTIFICATION_TYPES)
        + len(migrate.DEPARTMENTS)
    )
    assert len(gets) == expected
    assert len(puts) == expected
    assert gets[0][0].endswith("/api/home")
    assert puts[0][0].endswith("/api/home/")
    assert puts[0][2]["Authorization"] == "Bearer unit-test-dummy-token"
    assert any(params == {"type": "tenders"} for _url, params in gets)
    assert any(params == {"deep": True} for _url, params in gets)
    assert all(url.startswith("https://college-scraped.vercel.app") for url, _params in gets)
    assert all(url.startswith("http://localhost:8000") for url, _params, _headers, _json in puts)


def test_migrate_entrypoint_reports_a_mocked_failure(monkeypatch, capsys):
    def offline(*_args, **_kwargs):
        raise RuntimeError("offline")

    monkeypatch.setattr("requests.get", offline)
    import runpy

    runpy.run_path(str(Path(migrate.__file__).resolve()), run_name="__main__")
    assert "Migration failed: offline" in capsys.readouterr().out
