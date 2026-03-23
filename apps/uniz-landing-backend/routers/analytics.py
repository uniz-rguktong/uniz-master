import os
import urllib.parse
from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from jwt import PyJWTError as JWTError
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from typing import List, Dict, Any
from fastapi_cache.decorator import cache
from config import settings

# -----------------------------------------------------------------------------
# 1. ISOLATED JWT SIGNATURE VERIFICATION
# -----------------------------------------------------------------------------
security = HTTPBearer()

async def verify_jwt_signature(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Purely verifies the JWT signature using the server's secret key.
    If the signature is valid, the request proceeds. Otherwise, it is rejected.
    """
    token = credentials.credentials
    try:
        # Decodes and verifies the signature using your app settings
        payload = jwt.decode(token, settings.JWT_SECURITY_KEY, algorithms=[settings.JWT_ALGORITHM])
        return payload 
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Invalid or expired token signature"
        )

# Define the router with the prefix and the JWT dependency attached to all routes
router = APIRouter(
    prefix="/api/analytics", 
    tags=["Analytics"],
    dependencies=[Depends(verify_jwt_signature)]
)

# -----------------------------------------------------------------------------
# 2. ISOLATED DATABASE CONNECTION (PostgreSQL only for Analytics)
# -----------------------------------------------------------------------------
DB_USER = settings.DB_USER
DB_PASS = settings.DB_PASS
DB_HOST = settings.DB_HOST
DB_PORT = settings.DB_PORT
DB_NAME = settings.DB_NAME

encoded_password = urllib.parse.quote_plus(DB_PASS)
DATABASE_URL = f"postgresql+asyncpg://{DB_USER}:{encoded_password}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

analytics_engine = create_async_engine(
    DATABASE_URL, 
    echo=False,
    pool_size=20,             
    max_overflow=30,          
    pool_timeout=60,          
    pool_pre_ping=True,        
    pool_recycle=300,          
    connect_args={
        "command_timeout": 60, 
        "server_settings": {"tcp_keepalives_idle": "30"}
    }
)

async def fetch_records(query: str, params: dict = None) -> List[Dict[str, Any]]:
    """Executes SQL on the analytics database asynchronously."""
    async with analytics_engine.connect() as conn:
        result = await conn.execute(text(query), params or {})
        return [dict(row._mapping) for row in result.fetchall()]

# -----------------------------------------------------------------------------
# 3. ENDPOINTS
# -----------------------------------------------------------------------------

@router.get("/student/{student_id}/attendance")
async def get_student_attendance(student_id: str, response: Response):
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    query = """
        SELECT 
            a."subjectId", s.name as subject_name, a."totalClasses", a."attendedClasses",
            ROUND((a."attendedClasses"::numeric / NULLIF(a."totalClasses", 0)) * 100, 1) as attendance_percentage
        FROM uniz_academics."Attendance" a
        JOIN uniz_academics."Subject" s ON a."subjectId" = s.id
        WHERE a."studentId"::text = :student_id
    """
    return await fetch_records(query, {"student_id": student_id})

@router.get("/student/{student_id}/grades-trend")
async def get_student_grades_trend(student_id: str, response: Response):
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    query = """
        SELECT "semesterId", ROUND(AVG(grade)::numeric, 2) as sgpa
        FROM uniz_academics."Grade"
        WHERE "studentId"::text = :student_id
        GROUP BY "semesterId"
        ORDER BY "semesterId"
    """
    return await fetch_records(query, {"student_id": student_id})

@router.get("/faculty/{faculty_id}/course-stats")
@cache(expire=3600)
async def get_faculty_course_stats(faculty_id: str):
    query = """
        SELECT 
            ba.branch, sub.name as subject_name, 
            ROUND(AVG(g.grade)::numeric, 2) as average_grade, COUNT(g.grade) as total_students
        FROM uniz_academics."BranchAllocation" ba
        JOIN uniz_academics."Subject" sub ON ba."subjectId" = sub.id
        JOIN uniz_academics."Grade" g ON sub.id = g."subjectId"
        WHERE ba."facultyId"::text = :faculty_id AND ba."isApproved" = true
        GROUP BY ba.branch, sub.name
    """
    return await fetch_records(query, {"faculty_id": faculty_id})

@router.get("/dean/campus-occupancy")
@cache(expire=300)
async def get_campus_occupancy():
    query = """
        SELECT 
            COUNT(CASE WHEN "isPresentInCampus" = true THEN 1 END) as "Inside Campus",
            COUNT(CASE WHEN "isPresentInCampus" = false THEN 1 END) as "Outside Campus"
        FROM uniz_user."StudentProfile"
        WHERE "isSuspended" = false
    """
    records = await fetch_records(query)
    return records[0] if records else {"Inside Campus": 0, "Outside Campus": 0}

@router.get("/dean/academic-heatmap")
@cache(expire=43200)
async def get_academic_heatmap():
    query = """
        SELECT 
            g."semesterId", s.branch, sub.name AS subject_name,
            ROUND(AVG(g.grade)::numeric, 2) as average_grade
        FROM uniz_academics."Grade" g
        JOIN uniz_user."StudentProfile" s ON g."studentId"::text = s.id::text
        JOIN uniz_academics."Subject" sub ON g."subjectId"::text = sub.id::text
        GROUP BY g."semesterId", s.branch, sub.name
        ORDER BY g."semesterId", s.branch, sub.name
    """
    return await fetch_records(query)

@router.get("/dean/grievance-trends")
@cache(expire=3600)
async def get_grievance_trends():
    query = """
        SELECT category, status, COUNT(*) as count 
        FROM uniz_cron."Grievance" 
        GROUP BY category, status
    """
    return await fetch_records(query)

@router.get("/webmaster/upload-health")
@cache(expire=300)
async def get_upload_health():
    query = """
        SELECT 
            DATE("createdAt") as date, type, 
            SUM("successCount") as successCount, SUM("failCount") as failCount,
            ROUND((SUM("successCount")::numeric / NULLIF(SUM("successCount") + SUM("failCount"), 0)) * 100, 1) as success_rate_percent
        FROM uniz_user."UploadHistory"
        GROUP BY DATE("createdAt"), type
        ORDER BY date DESC
    """
    records = await fetch_records(query)
    for r in records: r['date'] = str(r['date'])
    return records

@router.get("/webmaster/system-users")
@cache(expire=3600)
async def get_system_user_distribution():
    query = """
        SELECT 
            role,
            COUNT(CASE WHEN "isDisabled" = false THEN 1 END) as "Active",
            COUNT(CASE WHEN "isDisabled" = true THEN 1 END) as "Disabled"
        FROM uniz_auth."AuthCredential"
        GROUP BY role
    """
    return await fetch_records(query)