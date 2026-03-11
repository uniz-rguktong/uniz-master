import enum
from sqlalchemy import Column, Integer, String, JSON, Enum
from database import Base

# --- ENUMS ---
class NotificationType(str, enum.Enum):
    news_updates = "news_updates"
    tenders = "tenders"
    careers = "careers"

class DepartmentType(str, enum.Enum):
    CSE = "CSE"
    CIVIL = "CIVIL"
    ECE = "ECE"
    EEE = "EEE"
    ME = "ME"
    MATHEMATICS = "MATHEMATICS"
    PHYSICS = "PHYSICS"
    CHEMISTRY = "CHEMISTRY"
    IT = "IT"
    BIOLOGY = "BIOLOGY"
    ENGLISH = "ENGLISH"
    LIB = "LIB"
    MANAGEMENT = "MANAGEMENT"
    PED = "PED"
    TELUGU = "TELUGU"
    YOGA = "YOGA"

class InstitutePageType(str, enum.Enum):
    aboutrgukt = "aboutrgukt"
    campuslife = "campuslife"
    edusys = "edusys"
    govcouncil = "govcouncil"
    rtiinfo = "rtiinfo"
    scst = "scst"

class AcademicPageType(str, enum.Enum):
    AcademicPrograms = "AcademicPrograms"
    AcademicCalender = "AcademicCalender"
    AcademicRegulations = "AcademicRegulations"
    curicula = "curicula"

# --- MODELS ---
class HomePageData(Base):
    __tablename__ = "home_page_data"
    
    id = Column(Integer, primary_key=True, index=True)
    announcements = Column(JSON, default=[])  # List of {text, link}
    stats = Column(JSON, default=[])          # List of {label, value}
    images = Column(JSON, default=[])         # List of URLs

class InstitutePage(Base):
    __tablename__ = "institute_pages"
    
    id = Column(Integer, primary_key=True, index=True)
    page_name = Column(String, unique=True, index=True) # e.g., 'aboutrgukt'
    sections = Column(JSON, default=[])                 # List of {title, content}
    profiles = Column(JSON, default=[])                 # List of {name, photo, text}

class AcademicPage(Base):
    __tablename__ = "academic_pages"
    
    id = Column(Integer, primary_key=True, index=True)
    page_name = Column(String, unique=True, index=True) # e.g., 'AcademicCalender'
    content = Column(JSON, default=[])                  # List of {header, links}

class Faculty(Base):
    __tablename__ = "faculty"
    
    id = Column(Integer, primary_key=True, index=True)
    department = Column(Enum(DepartmentType), index=True)
    name = Column(String)
    email = Column(String, unique=True, index=True)
    photo = Column(String, nullable=True)
    bio = Column(JSON, default={})                      # Deep bio details

class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    category = Column(Enum(NotificationType), index=True)
    title = Column(String)
    date = Column(String)                      # Stored as string due to scraping format
    links = Column(JSON, default=[])                    # List of {text, url}