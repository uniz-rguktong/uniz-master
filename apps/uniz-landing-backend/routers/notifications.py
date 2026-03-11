from fastapi import APIRouter, Depends, Query, HTTPException
from starlette import status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from typing import List
from database import get_db
import models
import schemas

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])

@router.get("/", response_model=List[schemas.NotificationResponse], status_code=status.HTTP_200_OK)
async def get_notifications(
    type: models.NotificationType = Query(..., description="Select the category"),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(models.Notification).filter(models.Notification.category == type))
    notifications = result.scalars().all()
    return notifications

@router.post("/", status_code=status.HTTP_200_OK)
async def sync_notifications(
    type: models.NotificationType, 
    data: List[schemas.NotificationResponse], 
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
        
        return {"message": f"Successfully synced {len(new_records)} items for {type.value}"}
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=f"Database error during notifications sync: {str(e)}"
        )