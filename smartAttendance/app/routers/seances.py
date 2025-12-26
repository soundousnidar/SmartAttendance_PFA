from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.seance import Seance
from app.models.cours import Cours
from app.models.user import User, UserRole
from app.schemas.seance import SeanceResponse
from app.utils.dependencies import require_role

router = APIRouter(prefix="/seances", tags=["Séances"])

@router.post("/start/{cours_id}", response_model=SeanceResponse)
def start_seance(
    cours_id: int,
    current_user: User = Depends(require_role([UserRole.ENSEIGNANT, UserRole.ADMIN, UserRole.SUPER_ADMIN])),
    db: Session = Depends(get_db)
):
    cours = db.query(Cours).filter(Cours.id == cours_id).first()
    if not cours:
        raise HTTPException(status_code=404, detail="Cours not found")
    
    if current_user.role == UserRole.ENSEIGNANT and cours.enseignant_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your course")
    
    # Créer séance avec les heures du cours
    seance = Seance(
        cours_id=cours_id,
        heure_debut=cours.heure_debut,
        heure_fin=cours.heure_fin
    )
    db.add(seance)
    db.commit()
    db.refresh(seance)
    return seance

@router.post("/end/{seance_id}")
def end_seance(
    seance_id: int,
    current_user: User = Depends(require_role([UserRole.ENSEIGNANT, UserRole.ADMIN, UserRole.SUPER_ADMIN])),
    db: Session = Depends(get_db)
):
    seance = db.query(Seance).filter(Seance.id == seance_id).first()
    if not seance:
        raise HTTPException(status_code=404, detail="Séance not found")
    
    seance.is_active = False
    db.commit()
    return {"message": "Séance ended"}

@router.get("/cours/{cours_id}", response_model=list[SeanceResponse])
def get_seances_by_cours(
    cours_id: int,
    current_user: User = Depends(require_role([UserRole.ENSEIGNANT, UserRole.ADMIN, UserRole.SUPER_ADMIN])),
    db: Session = Depends(get_db)
):
    return db.query(Seance).filter(Seance.cours_id == cours_id).all()
    