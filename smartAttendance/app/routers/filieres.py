from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.filiere import Filiere
from app.models.user import User, UserRole
from app.schemas.filiere import FiliereCreate, FiliereResponse
from app.utils.dependencies import require_role
from app.models.groupe import Groupe

router = APIRouter(prefix="/filieres", tags=["Filières"])

@router.post("/", response_model=FiliereResponse)
def create_filiere(
    filiere: FiliereCreate,
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.SUPER_ADMIN])),
    db: Session = Depends(get_db)
):
    existing = db.query(Filiere).filter(Filiere.code == filiere.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Filière existe déjà")
    
    new_filiere = Filiere(**filiere.dict())
    db.add(new_filiere)
    db.commit()
    db.refresh(new_filiere)
    return new_filiere

@router.get("/", response_model=list[FiliereResponse])
def get_all_filieres(db: Session = Depends(get_db)):
    return db.query(Filiere).all()

@router.get("/{filiere_id}", response_model=FiliereResponse)
def get_filiere(filiere_id: int, db: Session = Depends(get_db)):
    filiere = db.query(Filiere).filter(Filiere.id == filiere_id).first()
    if not filiere:
        raise HTTPException(status_code=404, detail="Filière not found")
    return filiere


@router.put("/{filiere_id}", response_model=FiliereResponse)
def update_filiere(
    filiere_id: int,
    filiere: FiliereCreate,
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.SUPER_ADMIN])),
    db: Session = Depends(get_db)
):
    db_filiere = db.query(Filiere).filter(Filiere.id == filiere_id).first()
    if not db_filiere:
        raise HTTPException(status_code=404, detail="Filière not found")
    
    db_filiere.code = filiere.code
    db_filiere.nom = filiere.nom
    
    db.commit()
    db.refresh(db_filiere)
    return db_filiere

@router.delete("/{filiere_id}")
def delete_filiere(
    filiere_id: int,
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.SUPER_ADMIN])),
    db: Session = Depends(get_db)
):
    db_filiere = db.query(Filiere).filter(Filiere.id == filiere_id).first()
    if not db_filiere:
        raise HTTPException(status_code=404, detail="Filière introuvable")
    
    # Vérifier s'il existe des groupes liés à cette filière
    groupes_count = db.query(Groupe).filter(Groupe.filiere_id == filiere_id).count()
    if groupes_count > 0:
        raise HTTPException(
            status_code=400, 
            detail=f"Impossible de supprimer cette filière. Elle contient encore {groupes_count} groupe(s). Veuillez d'abord supprimer tous les groupes associés."
        )
    
    db.delete(db_filiere)
    db.commit()
    return {"message": "Filière supprimée avec succès"}