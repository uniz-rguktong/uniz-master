from fastapi import APIRouter, Depends, HTTPException
from starlette import status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from database import get_db
import models
import schemas
from dependencies import AdminRole
from typing import List

router = APIRouter(prefix="/api/departments", tags=["Departments Staff"])

@router.get("/{dept_code}", response_model=schemas.DepartmentResponse, status_code=status.HTTP_200_OK)
async def get_department(dept_code: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.Faculty).filter(models.Faculty.department == dept_code))
    faculties = result.scalars().all()
    
    return {"dept": dept_code, "faculties": faculties}



@router.get("/list/all", response_model=List[str], status_code=status.HTTP_200_OK)
async def list_departments(db: AsyncSession = Depends(get_db)):
    """Returns a list of all unique department codes currently in the database."""
    result = await db.execute(select(models.Faculty.department).distinct())
    departments = result.scalars().all()
    
    # Filter out any None values just in case
    return [d for d in departments if d]

@router.put("/{dept_code}", status_code=status.HTTP_200_OK)
async def sync_department(
    dept_code: str,
    data: schemas.DepartmentResponse,
    user: AdminRole,
    db: AsyncSession = Depends(get_db)
):
    try:
        await db.execute(delete(models.Faculty).where(models.Faculty.department == dept_code))
        
        new_faculties = []
        for fac in data.faculties:
            new_record = models.Faculty(
                department=dept_code,
                name=fac.name,
                email=fac.email,
                photo=fac.photo,
                bio=fac.bio
            )
            new_faculties.append(new_record)
            
        db.add_all(new_faculties)
        await db.commit()
        
        
        return {"message": f"Successfully synced {len(new_faculties)} faculties for {dept_code}"}
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=f"Database error during department sync: {str(e)}"
        )