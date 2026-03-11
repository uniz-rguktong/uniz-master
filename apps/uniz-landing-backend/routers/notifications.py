from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import models
import schemas

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])

@router.get("/", response_model=List[schemas.NotificationResponse])
def get_notifications(
    type: models.NotificationType = Query(..., description="Select the category"),
    db: Session = Depends(get_db)
):
    notifications = db.query(models.Notification).filter(models.Notification.category == type).all()
    # Pydantic will automatically format the SQLAlchemy objects into the response schema
    return notifications

@router.post("/")
def sync_notifications(
    type: models.NotificationType, 
    data: List[schemas.NotificationResponse], 
    db: Session = Depends(get_db)
):
    # 1. Clear out the old notifications for this category
    db.query(models.Notification).filter(models.Notification.category == type).delete()
    
    # 2. Insert the fresh batch
    new_records = []
    for item in data:
        new_record = models.Notification(
            category=type,
            title=item.title,
            date_string=item.date,
            links=[link.model_dump() for link in item.links]
        )
        new_records.append(new_record)
        
    db.add_all(new_records)
    db.commit()
    
    return {"message": f"Successfully synced {len(new_records)} items for {type.value}"}