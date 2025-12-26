from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.groupe import Groupe
from app.models.user import User, UserRole
from app.schemas.groupe import GroupeCreate, GroupeResponse
from app.utils.dependencies import require_role

router = APIRouter(prefix="/groupes", tags=["Groupes"])

@router.post("/", response_model=GroupeResponse)
def create_groupe(
    groupe: GroupeCreate,
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.SUPER_ADMIN])),
    db: Session = Depends(get_db)
):
    new_groupe = Groupe(**groupe.dict())
    db.add(new_groupe)
    db.commit()
    db.refresh(new_groupe)
    return new_groupe

@router.get("/", response_model=list[GroupeResponse])
def get_all_groupes(db: Session = Depends(get_db)):
    return db.query(Groupe).all()

@router.get("/filiere/{filiere_id}", response_model=list[GroupeResponse])
def get_groupes_by_filiere(filiere_id: int, db: Session = Depends(get_db)):
    return db.query(Groupe).filter(Groupe.filiere_id == filiere_id).all()

@router.put("/{groupe_id}", response_model=GroupeResponse)
def update_groupe(
    groupe_id: int,
    groupe: GroupeCreate,
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.SUPER_ADMIN])),
    db: Session = Depends(get_db)
):
    db_groupe = db.query(Groupe).filter(Groupe.id == groupe_id).first()
    if not db_groupe:
        raise HTTPException(status_code=404, detail="Groupe not found")
    
    db_groupe.code = groupe.code
    db_groupe.filiere_id = groupe.filiere_id
    db_groupe.annee = groupe.annee
    
    db.commit()
    db.refresh(db_groupe)
    return db_groupe

@router.delete("/{groupe_id}")
def delete_groupe(
    groupe_id: int,
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.SUPER_ADMIN])),
    db: Session = Depends(get_db)
):
    db_groupe = db.query(Groupe).filter(Groupe.id == groupe_id).first()
    if not db_groupe:
        raise HTTPException(status_code=404, detail="Groupe not found")
    
    db.delete(db_groupe)
    db.commit()
    return {"message": "Groupe deleted"}