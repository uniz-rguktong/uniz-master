from fastapi import APIRouter, Depends, HTTPException, Path
from starlette import status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
import models
import schemas
from dependencies import AdminRole

router = APIRouter(prefix="/api/institute", tags=["Institute"])

@router.get("/{page_name}", response_model=schemas.InstitutePageResponse, status_code=status.HTTP_200_OK)
async def get_institute_page(
    page_name: models.InstitutePageType = Path(..., description="The name of the college info page"), 
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(models.InstitutePage).filter(models.InstitutePage.page_name == page_name.value))
    page_data = result.scalars().first()
    
    if not page_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail=f"Page '{page_name.value}' not found in database."
        )
    
    return {"page": page_data.page_name, "sections": page_data.sections, "profiles": page_data.profiles}

@router.post("/{page_name}", response_model=schemas.InstitutePageResponse, status_code=status.HTTP_200_OK)
async def sync_institute_page(
    page_name: models.InstitutePageType, 
    data: schemas.InstitutePageResponse, 
    user: AdminRole,
    db: AsyncSession = Depends(get_db)
):
    try:
        result = await db.execute(select(models.InstitutePage).filter(models.InstitutePage.page_name == page_name.value))
        page_data = result.scalars().first()
        
        if not page_data:
            page_data = models.InstitutePage(page_name=page_name.value)
            db.add(page_data)

        page_data.sections = [item.model_dump() for item in data.sections]
        page_data.profiles = [item.model_dump() for item in data.profiles]

        await db.commit()
        return data
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=f"Database error during institute sync: {str(e)}"
        )