from pydantic import BaseModel, Field, AliasChoices
from typing import List, Optional, Dict, Any
from models import NotificationType, DepartmentType

# --- SHARED SCHEMAS ---
# schemas.py

class LinkItem(BaseModel):
    label: str = Field(validation_alias=AliasChoices('text', 'label'))
    url: Optional[str] = None


# --- HOME SCHEMAS ---
class AnnouncementItem(BaseModel):
    text: str
    link: Optional[str] = None

class StatItem(BaseModel):
    label: str
    value: str

class HomePageResponse(BaseModel):
    announcements: List[AnnouncementItem]
    stats: List[StatItem]
    images: List[str]

# --- INSTITUTE SCHEMAS ---
class InstituteSection(BaseModel):
    title: str
    content: List[str]

class InstituteProfile(BaseModel):
    name: str
    photo: Optional[str] = None
    text: List[str]

class InstitutePageResponse(BaseModel):
    page: str
    sections: List[InstituteSection]
    profiles: List[InstituteProfile]

# --- ACADEMIC SCHEMAS ---
class AcademicSection(BaseModel):
    header: str
    links: List[LinkItem]

# --- FACULTY SCHEMAS ---
class FacultyMember(BaseModel):
    name: str
    email: str
    photo: Optional[str] = None
    bio: Dict[str, Any]

class DepartmentResponse(BaseModel):
    dept: DepartmentType
    faculties: List[FacultyMember]

# --- NOTIFICATION SCHEMAS ---
class NotificationResponse(BaseModel):
    title: str
    date: str
    links: List[LinkItem]