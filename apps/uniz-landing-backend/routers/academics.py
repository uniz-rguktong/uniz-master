from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import models
import schemas

router = APIRouter(prefix="/api/academics", tags=["Academics"])

@router.get("/{page_name}", response_model=List[schemas.AcademicSection])
def get_academic_page(page_name: models.AcademicPageType, db: Session = Depends(get_db)):
    page_data = db.query(models.AcademicPage).filter(models.AcademicPage.page_name == page_name.value).first()
    
    if not page_data:
        raise HTTPException(status_code=404, detail=f"Page '{page_name.value}' not found in database.")
    
    return page_data.content


@router.post("/{page_name}", response_model=List[schemas.AcademicSection])
def sync_academic_page(
    page_name: models.AcademicPageType,
    data: List[schemas.AcademicSection], # This MUST be a List
    db: Session = Depends(get_db)
):
    page_data = db.query(models.AcademicPage).filter(models.AcademicPage.page_name == page_name.value).first()
    
    if not page_data:
        page_data = models.AcademicPage(page_name=page_name.value)
        db.add(page_data)

    page_data.content = [item.model_dump() for item in data]
    db.commit()
    return data