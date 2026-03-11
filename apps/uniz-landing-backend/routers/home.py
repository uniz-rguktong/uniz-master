from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas

router = APIRouter(prefix="/api/home", tags=["Home"])

@router.get("/", response_model=schemas.HomePageResponse)
def get_home_data(db: Session = Depends(get_db)):
    home_data = db.query(models.HomePageData).first()
    if not home_data:
        # Return empty structure if DB is brand new
        return {"announcements": [], "stats": [], "images": []}
    return home_data

@router.post("/", response_model=schemas.HomePageResponse)
def sync_home_data(data: schemas.HomePageResponse, db: Session = Depends(get_db)):
    home_data = db.query(models.HomePageData).first()
    
    if not home_data:
        home_data = models.HomePageData()
        db.add(home_data)

    # Dump the Pydantic models to dicts/lists for JSON columns
    home_data.announcements = [item.model_dump() for item in data.announcements]
    home_data.stats = [item.model_dump() for item in data.stats]
    home_data.images = data.images

    db.commit()
    db.refresh(home_data)
    return home_data