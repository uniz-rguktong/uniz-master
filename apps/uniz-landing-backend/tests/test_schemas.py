import pytest
from pydantic import ValidationError

from schemas import (
    AcademicSection,
    AnnouncementItem,
    DepartmentResponse,
    FacultyMember,
    HomePageResponse,
    InstitutePageResponse,
    InstituteProfile,
    InstituteSection,
    LinkItem,
    NotificationResponse,
    StatItem,
)


def test_link_item_accepts_text_or_label():
    from_text = LinkItem.model_validate({"text": "Admissions", "url": "/admissions"})
    from_label = LinkItem.model_validate({"label": "Admissions"})
    assert from_text.label == "Admissions"
    assert from_text.url == "/admissions"
    assert from_label.label == "Admissions"
    assert from_label.url is None
    assert from_text.model_dump() == {"label": "Admissions", "url": "/admissions"}


def test_home_page_round_trip():
    page = HomePageResponse(
        announcements=[AnnouncementItem(text="Welcome", link="/news")],
        stats=[StatItem(label="Students", value="2000")],
        images=["/campus.jpg"],
    )
    dumped = page.model_dump()
    assert dumped["announcements"][0]["text"] == "Welcome"
    assert dumped["stats"][0] == {"label": "Students", "value": "2000"}
    assert dumped["images"] == ["/campus.jpg"]


def test_institute_and_academic_shapes():
    page = InstitutePageResponse(
        page="aboutrgukt",
        sections=[InstituteSection(title="About", content=["A campus in Ongole."])],
        profiles=[InstituteProfile(name="Director", text=["Hello"])],
    )
    assert page.profiles[0].photo is None
    section = AcademicSection(
        header="Programs",
        links=[LinkItem.model_validate({"text": "B.Tech", "url": "/btech"})],
    )
    assert section.links[0].label == "B.Tech"


def test_faculty_requires_an_email_and_notification_keeps_links():
    with pytest.raises(ValidationError):
        FacultyMember.model_validate({"name": "Ada", "bio": {}})

    member = FacultyMember(name="Ada", email="ada@rguktong.ac.in", bio={"role": "HoD"})
    dept = DepartmentResponse(dept="CSE", faculties=[member])
    assert dept.faculties[0].photo is None
    assert dept.model_dump()["faculties"][0]["bio"] == {"role": "HoD"}

    note = NotificationResponse(
        title="Tender",
        date="2026-01-02",
        links=[LinkItem.model_validate({"text": "PDF"})],
    )
    assert note.links[0].url is None
