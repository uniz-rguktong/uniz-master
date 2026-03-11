from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas

router = APIRouter(prefix="/api/departments", tags=["Departments Staff"])

@router.get("/{dept_code}", response_model=schemas.DepartmentResponse)
def get_department(dept_code: models.DepartmentType, db: Session = Depends(get_db)):
    faculties = db.query(models.Faculty).filter(models.Faculty.department == dept_code).all()
    
    # We return the structure even if faculties list is empty
    return {"dept": dept_code, "faculties": faculties}

@router.post("/{dept_code}")
def sync_department(
    dept_code: models.DepartmentType,
    data: schemas.DepartmentResponse,
    db: Session = Depends(get_db)
):
    # 1. Clear out old faculty for this department
    db.query(models.Faculty).filter(models.Faculty.department == dept_code).delete()
    
    # 2. Insert the fresh batch
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
    db.commit()
    
    return {"message": f"Successfully synced {len(new_faculties)} faculties for {dept_code.value}"}