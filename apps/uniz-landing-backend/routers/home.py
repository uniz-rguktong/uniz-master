from fastapi import APIRouter, Depends, HTTPException
from starlette import status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
import models
import schemas
from dependencies import AdminRole

router = APIRouter(prefix="/api/home", tags=["Home"])

@router.get("/", response_model=schemas.HomePageResponse, status_code=status.HTTP_200_OK)
async def get_home_data(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.HomePageData))
    home_data = result.scalars().first()
    
    if not home_data:
        return {"announcements": [], "stats": [], "images": []}
    return home_data


@router.put("/", response_model=schemas.HomePageResponse, status_code=status.HTTP_200_OK)
async def sync_home_data(
    data: schemas.HomePageResponse, 
    user: AdminRole,
    db: AsyncSession = Depends(get_db)
):
    try:
        result = await db.execute(select(models.HomePageData))
        home_data = result.scalars().first()
        
        if not home_data:
            home_data = models.HomePageData()
            db.add(home_data)

        home_data.announcements = [item.model_dump() for item in data.announcements]
        home_data.stats = [item.model_dump() for item in data.stats]
        home_data.images = data.images

        await db.commit()
        await db.refresh(home_data)
        return home_data
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=f"Database error during home sync: {str(e)}"
        )