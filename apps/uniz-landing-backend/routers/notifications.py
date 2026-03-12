from fastapi import APIRouter, Depends, Query, HTTPException
from starlette import status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from typing import List
from database import get_db
import models
import schemas
from dependencies import AdminRole

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])

@router.get("/", response_model=List[schemas.NotificationResponse], status_code=status.HTTP_200_OK)
async def get_notifications(
    type: str = Query(..., description="Select the category"),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(models.Notification).filter(models.Notification.category == type))
    notifications = result.scalars().all()
    return notifications

@router.get("/list/categories", response_model=List[str], status_code=status.HTTP_200_OK)
async def list_notification_categories(db: AsyncSession = Depends(get_db)):
    """Returns a list of all unique notification categories."""
    result = await db.execute(select(models.Notification.category).distinct())
    categories = result.scalars().all()
    
    return [c for c in categories if c]

@router.put("/", status_code=status.HTTP_200_OK)
async def sync_notifications(
    type: str,
    data: List[schemas.NotificationResponse], 
    user: AdminRole,
    db: AsyncSession = Depends(get_db)
):
    try:
        await db.execute(delete(models.Notification).where(models.Notification.category == type))
        
        new_records = []
        for item in data:
            new_record = models.Notification(
                category=type,
                title=item.title,
                date=item.date,
                links=[link.model_dump() for link in item.links]
            )
            new_records.append(new_record)
            
        db.add_all(new_records)
        await db.commit()
        
        return {"message": f"Successfully synced {len(new_records)} items for {type}"}
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=f"Database error during notifications sync: {str(e)}"
        )