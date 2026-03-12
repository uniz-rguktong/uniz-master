from fastapi import APIRouter, Depends, HTTPException
from starlette import status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from database import get_db
import models
import schemas
from dependencies import AdminRole

router = APIRouter(prefix="/api/academics", tags=["Academics"])

@router.get("/{page_name}", response_model=List[schemas.AcademicSection], status_code=status.HTTP_200_OK)
async def get_academic_page(page_name: models.AcademicPageType, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.AcademicPage).filter(models.AcademicPage.page_name == page_name.value))
    page_data = result.scalars().first()
    
    if not page_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail=f"Page '{page_name.value}' not found in database."
        )
    
    return page_data.content

@router.post("/{page_name}", response_model=List[schemas.AcademicSection], status_code=status.HTTP_200_OK)
async def sync_academic_page(
    page_name: models.AcademicPageType,
    data: List[schemas.AcademicSection],
    user: AdminRole,
    db: AsyncSession = Depends(get_db)
):
    try:
        result = await db.execute(select(models.AcademicPage).filter(models.AcademicPage.page_name == page_name.value))
        page_data = result.scalars().first()
        
        if not page_data:
            page_data = models.AcademicPage(page_name=page_name.value)
            db.add(page_data)

        page_data.content = [item.model_dump() for item in data]
        await db.commit()
        return data
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=f"Database error during academics sync: {str(e)}"
        )