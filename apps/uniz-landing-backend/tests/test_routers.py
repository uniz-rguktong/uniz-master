import pytest
from fastapi import HTTPException

import models
import schemas
from routers import academics, departments, home, institute, notifications
from tests.fakes import FakeDB


def _home_payload():
    return schemas.HomePageResponse(
        announcements=[schemas.AnnouncementItem(text="Welcome", link="/news")],
        stats=[schemas.StatItem(label="Students", value="2000")],
        images=["/campus.jpg"],
    )


@pytest.mark.asyncio
async def test_home_returns_empty_lists_when_missing():
    body = await home.get_home_data(FakeDB(None))
    assert body == {"announcements": [], "stats": [], "images": []}


@pytest.mark.asyncio
async def test_home_returns_the_stored_row():
    row = models.HomePageData(announcements=[], stats=[], images=["/a.jpg"])
    assert await home.get_home_data(FakeDB(row)) is row


@pytest.mark.asyncio
async def test_home_sync_creates_or_updates_and_rolls_back():
    created = FakeDB(None)
    created_body = await home.sync_home_data(_home_payload(), {"username": "ada"}, created)
    assert created.added
    assert created.committed
    assert created.refreshed == [created_body]
    assert created_body.images == ["/campus.jpg"]
    assert created_body.announcements == [{"text": "Welcome", "link": "/news"}]

    existing = models.HomePageData()
    updated = FakeDB(existing)
    body = await home.sync_home_data(_home_payload(), {"username": "ada"}, updated)
    assert body is existing
    assert updated.added == []
    assert existing.stats == [{"label": "Students", "value": "2000"}]

    failing = FakeDB(existing, error=RuntimeError("disk full"))
    with pytest.raises(HTTPException) as exc:
        await home.sync_home_data(_home_payload(), {"username": "ada"}, failing)
    assert exc.value.status_code == 500
    assert "disk full" in exc.value.detail
    assert failing.rolled_back


@pytest.mark.asyncio
async def test_institute_get_list_and_sync():
    missing = FakeDB(None)
    with pytest.raises(HTTPException) as exc:
        await institute.get_institute_page("missing", missing)
    assert exc.value.status_code == 404
    assert "missing" in exc.value.detail

    row = models.InstitutePage(page_name="campuslife", sections=["s"], profiles=["p"])
    body = await institute.get_institute_page("campuslife", FakeDB(row))
    assert body == {"page": "campuslife", "sections": ["s"], "profiles": ["p"]}

    pages = await institute.list_institute_pages(FakeDB(["aboutrgukt", "campuslife"]))
    assert pages == ["aboutrgukt", "campuslife"]

    data = schemas.InstitutePageResponse(
        page="campuslife",
        sections=[schemas.InstituteSection(title="Life", content=["Hostels"])],
        profiles=[schemas.InstituteProfile(name="Dean", text=["Hi"])],
    )
    fresh = FakeDB(None)
    assert await institute.sync_institute_page("campuslife", data, {}, fresh) is data
    assert fresh.added[0].page_name == "campuslife"
    assert fresh.added[0].sections[0]["title"] == "Life"

    stored = models.InstitutePage(page_name="campuslife")
    again = FakeDB(stored)
    await institute.sync_institute_page("campuslife", data, {}, again)
    assert again.added == []
    assert stored.profiles[0]["name"] == "Dean"

    failing = FakeDB(None, error=RuntimeError("locked"))
    with pytest.raises(HTTPException) as exc:
        await institute.sync_institute_page("campuslife", data, {}, failing)
    assert exc.value.status_code == 500
    assert failing.rolled_back


@pytest.mark.asyncio
async def test_academics_get_list_and_sync():
    with pytest.raises(HTTPException) as exc:
        await academics.get_academic_page("missing", FakeDB(None))
    assert exc.value.status_code == 404

    row = models.AcademicPage(page_name="programs", content=[{"header": "UG", "links": []}])
    assert await academics.get_academic_page("programs", FakeDB(row)) == row.content
    assert await academics.list_academic_pages(FakeDB(["programs"])) == ["programs"]

    data = [
        schemas.AcademicSection(
            header="UG",
            links=[schemas.LinkItem.model_validate({"text": "B.Tech"})],
        )
    ]
    fresh = FakeDB(None)
    assert await academics.sync_academic_page("programs", data, {}, fresh) is data
    assert fresh.added[0].content[0]["header"] == "UG"

    stored = models.AcademicPage(page_name="programs")
    again = FakeDB(stored)
    await academics.sync_academic_page("programs", data, {}, again)
    assert stored.content[0]["links"][0]["label"] == "B.Tech"

    failing = FakeDB(stored, error=RuntimeError("nope"))
    with pytest.raises(HTTPException) as exc:
        await academics.sync_academic_page("programs", data, {}, failing)
    assert exc.value.status_code == 500
    assert failing.rolled_back


@pytest.mark.asyncio
async def test_departments_list_filters_blanks_and_sync_replaces_rows():
    body = await departments.get_department("CSE", FakeDB([]))
    assert body == {"dept": "CSE", "faculties": []}

    codes = await departments.list_departments(FakeDB(["CSE", None, "", "ECE"]))
    assert codes == ["CSE", "ECE"]

    data = schemas.DepartmentResponse(
        dept="CSE",
        faculties=[
            schemas.FacultyMember(
                name="Ada",
                email="ada@rguktong.ac.in",
                photo="/ada.jpg",
                bio={"role": "HoD"},
            )
        ],
    )
    db = FakeDB([])
    message = await departments.sync_department("CSE", data, {}, db)
    assert message == {"message": "Successfully synced 1 faculties for CSE"}
    assert db.committed
    assert db.added_all[0].department == "CSE"
    assert db.added_all[0].email == "ada@rguktong.ac.in"

    failing = FakeDB([], error=RuntimeError("constraint"))
    with pytest.raises(HTTPException) as exc:
        await departments.sync_department("CSE", data, {}, failing)
    assert exc.value.status_code == 500
    assert "constraint" in exc.value.detail
    assert failing.rolled_back


@pytest.mark.asyncio
async def test_notifications_list_filters_blanks_and_sync_copies_links():
    rows = [models.Notification(category="news_updates", title="A", date="today", links=[])]
    assert await notifications.get_notifications("news_updates", FakeDB(rows)) is rows
    assert await notifications.list_notification_categories(FakeDB(["news_updates", None])) == [
        "news_updates"
    ]

    data = [
        schemas.NotificationResponse(
            title="Tender",
            date="2026-01-02",
            links=[schemas.LinkItem.model_validate({"text": "PDF", "url": "/t.pdf"})],
        )
    ]
    db = FakeDB([])
    message = await notifications.sync_notifications("tenders", data, {}, db)
    assert message == {"message": "Successfully synced 1 items for tenders"}
    assert db.added_all[0].category == "tenders"
    assert db.added_all[0].links == [{"label": "PDF", "url": "/t.pdf"}]

    failing = FakeDB([], error=RuntimeError("rollback"))
    with pytest.raises(HTTPException) as exc:
        await notifications.sync_notifications("tenders", data, {}, failing)
    assert exc.value.status_code == 500
    assert failing.rolled_back
