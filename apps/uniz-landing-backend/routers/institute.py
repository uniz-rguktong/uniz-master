from fastapi import APIRouter, Depends, HTTPException, Path
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas

router = APIRouter(prefix="/api/institute", tags=["Institute"])

@router.get("/{page_name}", response_model=schemas.InstitutePageResponse)
def get_institute_page(page_name: models.InstitutePageType = Path(..., description="The name of the college info page"), 
                       db: Session = Depends(get_db)):
    page_data = db.query(models.InstitutePage).filter(models.InstitutePage.page_name == page_name.value).first()
    if not page_data:
        raise HTTPException(status_code=404, detail=f"Page '{page_name.value}' not found in database.")
    
    return {"page": page_data.page_name, "sections": page_data.sections, "profiles": page_data.profiles}


@router.post("/{page_name}", response_model=schemas.InstitutePageResponse)
def sync_institute_page(
    page_name: models.InstitutePageType, 
    data: schemas.InstitutePageResponse, 
    db: Session = Depends(get_db)
):
    # Use .value to query the database string correctly
    page_data = db.query(models.InstitutePage).filter(models.InstitutePage.page_name == page_name.value).first()
    
    if not page_data:
        page_data = models.InstitutePage(page_name=page_name.value)
        db.add(page_data)

    # Convert Pydantic models to dicts for JSON columns
    page_data.sections = [item.model_dump() for item in data.sections]
    page_data.profiles = [item.model_dump() for item in data.profiles]

    db.commit()
    return data