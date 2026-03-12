# models.py
from sqlalchemy import Column, Integer, String, JSON
from database import Base

class HomePageData(Base):
    __tablename__ = "home_page_data"
    id = Column(Integer, primary_key=True, index=True)
    announcements = Column(JSON, default=[])
    stats = Column(JSON, default=[])
    images = Column(JSON, default=[])

class InstitutePage(Base):
    __tablename__ = "institute_pages"
    id = Column(Integer, primary_key=True, index=True)
    page_name = Column(String, unique=True, index=True) 
    sections = Column(JSON, default=[])
    profiles = Column(JSON, default=[])

class AcademicPage(Base):
    __tablename__ = "academic_pages"
    id = Column(Integer, primary_key=True, index=True)
    page_name = Column(String, unique=True, index=True)
    content = Column(JSON, default=[])

class Faculty(Base):
    __tablename__ = "faculty"
    id = Column(Integer, primary_key=True, index=True)
    department = Column(String, index=True) # Changed from Enum to String
    name = Column(String)
    email = Column(String, unique=True, index=True)
    photo = Column(String, nullable=True)
    bio = Column(JSON, default={})

class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    category = Column(String, index=True)   # Changed from Enum to String
    title = Column(String)
    date = Column(String)
    links = Column(JSON, default=[])