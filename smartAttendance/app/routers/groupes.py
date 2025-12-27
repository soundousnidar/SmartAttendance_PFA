from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.groupe import Groupe
from app.models.student import Student
from app.models.filiere import Filiere  # ← AJOUTER
from app.models.user import User, UserRole
from app.schemas.groupe import GroupeCreate, GroupeResponse
from app.utils.dependencies import require_role

router = APIRouter(prefix="/groupes", tags=["Groupes"])

def generate_groupe_name(db: Session, filiere_id: int, annee: int, code: str) -> str:
    """Génère le nom complet du groupe: {annee}{code_filiere}-{code_groupe}"""
    filiere = db.query(Filiere).filter(Filiere.id == filiere_id).first()
    if not filiere:
        return code
    return f"{annee}{filiere.code}-{code}"

@router.post("/", response_model=GroupeResponse)
def create_groupe(
    groupe: GroupeCreate,
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.SUPER_ADMIN])),
    db: Session = Depends(get_db)
):
    # Générer le nom complet
    full_name = generate_groupe_name(db, groupe.filiere_id, groupe.annee, groupe.code)
    
    new_groupe = Groupe(
        code=full_name,  # ← Utiliser le nom complet généré
        filiere_id=groupe.filiere_id,
        annee=groupe.annee
    )
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
    
    # Régénérer le nom complet lors de la modification
    full_name = generate_groupe_name(db, groupe.filiere_id, groupe.annee, groupe.code)
    
    db_groupe.code = full_name
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
    
    # Vérifier s'il y a des étudiants dans ce groupe
    students_count = db.query(Student).filter(Student.groupe_id == groupe_id).count()
    if students_count > 0:
        raise HTTPException(
            status_code=400, 
            detail=f"Impossible de supprimer ce groupe car {students_count} étudiant(s) y sont assigné(s)"
        )
    
    db.delete(db_groupe)
    db.commit()
    return {"message": "Groupe deleted"}