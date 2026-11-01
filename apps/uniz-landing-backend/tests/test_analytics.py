from datetime import date
from types import SimpleNamespace

import jwt
import pytest
from fastapi import HTTPException, Response

from routers import analytics

SECRET = "unit-test-jwt-secret-0123456789ab"


def _token():
    return jwt.encode({"sub": "ada"}, SECRET, algorithm="HS256")


class _Row:
    def __init__(self, data):
        self._mapping = data


class _Result:
    def __init__(self, rows):
        self._rows = rows

    def fetchall(self):
        return [_Row(row) for row in self._rows]


class _Conn:
    def __init__(self, rows):
        self.rows = rows
        self.query = None
        self.params = None

    async def execute(self, query, params=None):
        self.query = str(query)
        self.params = params
        return _Result(self.rows)


class _Connect:
    def __init__(self, conn):
        self.conn = conn

    async def __aenter__(self):
        return self.conn

    async def __aexit__(self, *_args):
        return False


@pytest.mark.asyncio
async def test_verify_jwt_signature_accepts_a_signed_token():
    payload = await analytics.verify_jwt_signature(SimpleNamespace(credentials=_token()))
    assert payload["sub"] == "ada"


@pytest.mark.asyncio
async def test_verify_jwt_signature_rejects_a_bad_token():
    with pytest.raises(HTTPException) as exc:
        await analytics.verify_jwt_signature(SimpleNamespace(credentials="nope"))
    assert exc.value.status_code == 401
    assert exc.value.detail == "Invalid or expired token signature"


@pytest.mark.asyncio
async def test_fetch_records_maps_rows(monkeypatch):
    conn = _Conn([{"id": 1}, {"id": 2}])

    class Engine:
        def connect(self):
            return _Connect(conn)

    monkeypatch.setattr(analytics, "analytics_engine", Engine())
    rows = await analytics.fetch_records("SELECT 1", {"student_id": "s1"})
    assert rows == [{"id": 1}, {"id": 2}]
    assert conn.params == {"student_id": "s1"}

    conn.rows = []
    await analytics.fetch_records("SELECT 2")
    assert conn.params == {}


@pytest.mark.asyncio
async def test_student_and_faculty_queries_pass_ids_and_disable_cache(monkeypatch):
    seen = {}

    async def fake(query, params=None):
        seen["query"] = query
        seen["params"] = params
        return [{"subject_name": "Maths"}]

    monkeypatch.setattr(analytics, "fetch_records", fake)
    response = Response()
    body = await analytics.get_student_attendance("stu-1", response)
    assert body == [{"subject_name": "Maths"}]
    assert seen["params"] == {"student_id": "stu-1"}
    assert "Attendance" in seen["query"]
    assert response.headers["Cache-Control"].startswith("no-cache")
    assert response.headers["Pragma"] == "no-cache"
    assert response.headers["Expires"] == "0"

    response = Response()
    await analytics.get_student_grades_trend("stu-1", response)
    assert seen["params"] == {"student_id": "stu-1"}
    assert "Grade" in seen["query"]
    assert response.headers["Cache-Control"].startswith("no-cache")

    await analytics.get_faculty_course_stats.__wrapped__("fac-9")
    assert seen["params"] == {"faculty_id": "fac-9"}
    assert "BranchAllocation" in seen["query"]


@pytest.mark.asyncio
async def test_dean_and_webmaster_queries(monkeypatch):
    async def occupancy(query, params=None):
        assert "StudentProfile" in query
        assert params is None
        return [{"Inside Campus": 10, "Outside Campus": 4}]

    monkeypatch.setattr(analytics, "fetch_records", occupancy)
    response = Response()
    assert await analytics.get_campus_occupancy(response) == {
        "Inside Campus": 10,
        "Outside Campus": 4,
    }
    assert response.headers["Pragma"] == "no-cache"

    async def empty(_query, params=None):
        return []

    monkeypatch.setattr(analytics, "fetch_records", empty)
    response = Response()
    assert await analytics.get_campus_occupancy(response) == {
        "Inside Campus": 0,
        "Outside Campus": 0,
    }

    async def heatmap(query, params=None):
        assert "semesterId" in query
        return [{"branch": "CSE"}]

    monkeypatch.setattr(analytics, "fetch_records", heatmap)
    assert await analytics.get_academic_heatmap.__wrapped__() == [{"branch": "CSE"}]

    async def grievances(query, params=None):
        assert "Grievance" in query
        return [{"category": "hostel", "count": 2}]

    monkeypatch.setattr(analytics, "fetch_records", grievances)
    assert (await analytics.get_grievance_trends.__wrapped__())[0]["count"] == 2
    assert (await analytics.get_grievance_summary.__wrapped__())[0]["category"] == "hostel"

    async def snapshot(query, params=None):
        assert "avg_cgpa" in query
        return [{"total_students": 3}]

    monkeypatch.setattr(analytics, "fetch_records", snapshot)
    response = Response()
    assert await analytics.get_institution_snapshot(response) == {"total_students": 3}
    assert response.headers["Expires"] == "0"

    monkeypatch.setattr(analytics, "fetch_records", empty)
    response = Response()
    assert await analytics.get_institution_snapshot(response) == {}

    async def branches(query, params=None):
        assert "LIMIT 8" in query
        return [{"branch": "CSE", "count": 8}]

    monkeypatch.setattr(analytics, "fetch_records", branches)
    assert await analytics.get_branch_distribution.__wrapped__() == [
        {"branch": "CSE", "count": 8}
    ]

    async def uploads(query, params=None):
        assert "UploadHistory" in query
        return [{"date": date(2026, 1, 2), "type": "csv"}]

    monkeypatch.setattr(analytics, "fetch_records", uploads)
    rows = await analytics.get_upload_health.__wrapped__()
    assert rows == [{"date": "2026-01-02", "type": "csv"}]

    async def users(query, params=None):
        assert "AuthCredential" in query
        return [{"role": "student", "Active": 4, "Disabled": 1}]

    monkeypatch.setattr(analytics, "fetch_records", users)
    assert (await analytics.get_system_user_distribution.__wrapped__())[0]["Active"] == 4
