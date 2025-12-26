from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.cours import Cours
from app.models.module import Module
from app.models.groupe import Groupe
from app.models.user import User, UserRole
from app.schemas.cours import CoursCreate, CoursResponse, CoursWithDetails
from app.utils.dependencies import require_role

router = APIRouter(prefix="/cours", tags=["Cours"])

@router.post("/", response_model=CoursResponse)
def create_cours(
    cours: CoursCreate,
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.SUPER_ADMIN])),
    db: Session = Depends(get_db)
):
    """Créer un cours dans l'emploi du temps"""
    new_cours = Cours(**cours.dict())
    db.add(new_cours)
    db.commit()
    db.refresh(new_cours)
    return new_cours

@router.get("/", response_model=list[CoursWithDetails])
def get_all_cours(
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.ENSEIGNANT])),
    db: Session = Depends(get_db)
):
    """Liste de tous les cours avec détails"""
    cours_list = db.query(Cours).all()
    
    result = []
    for cours in cours_list:
        module = db.query(Module).filter(Module.id == cours.module_id).first()
        groupe = db.query(Groupe).filter(Groupe.id == cours.groupe_id).first()
        enseignant = db.query(User).filter(User.id == cours.enseignant_id).first()
        
        result.append({
            "id": cours.id,
            "module": {
                "id": module.id,
                "code": module.code,
                "nom": module.nom
            } if module else None,
            "groupe": {
                "id": groupe.id,
                "code": groupe.code
            } if groupe else None,
            "enseignant": {
                "id": enseignant.id,
                "full_name": enseignant.full_name
            } if enseignant else None,
            "jour": cours.jour,
            "heure_debut": cours.heure_debut,
            "heure_fin": cours.heure_fin,
            "salle": cours.salle
        })
    
    return result

@router.get("/groupe/{groupe_id}", response_model=list[CoursWithDetails])
def get_cours_by_groupe(
    groupe_id: int,
    db: Session = Depends(get_db)
):
    """Emploi du temps d'un groupe"""
    cours_list = db.query(Cours).filter(Cours.groupe_id == groupe_id).all()
    
    result = []
    for cours in cours_list:
        module = db.query(Module).filter(Module.id == cours.module_id).first()
        groupe = db.query(Groupe).filter(Groupe.id == cours.groupe_id).first()
        enseignant = db.query(User).filter(User.id == cours.enseignant_id).first()
        
        result.append({
            "id": cours.id,
            "module": {
                "id": module.id,
                "code": module.code,
                "nom": module.nom
            } if module else None,
            "groupe": {
                "id": groupe.id,
                "code": groupe.code
            } if groupe else None,
            "enseignant": {
                "id": enseignant.id,
                "full_name": enseignant.full_name
            } if enseignant else None,
            "jour": cours.jour,
            "heure_debut": cours.heure_debut,
            "heure_fin": cours.heure_fin,
            "salle": cours.salle
        })
    
    return result

@router.get("/enseignant/{enseignant_id}", response_model=list[CoursWithDetails])
def get_cours_by_enseignant(
    enseignant_id: int,
    db: Session = Depends(get_db)
):
    """Emploi du temps d'un enseignant"""
    cours_list = db.query(Cours).filter(Cours.enseignant_id == enseignant_id).all()
    
    result = []
    for cours in cours_list:
        module = db.query(Module).filter(Module.id == cours.module_id).first()
        groupe = db.query(Groupe).filter(Groupe.id == cours.groupe_id).first()
        enseignant = db.query(User).filter(User.id == cours.enseignant_id).first()
        
        result.append({
            "id": cours.id,
            "module": {
                "id": module.id,
                "code": module.code,
                "nom": module.nom
            } if module else None,
            "groupe": {
                "id": groupe.id,
                "code": groupe.code
            } if groupe else None,
            "enseignant": {
                "id": enseignant.id,
                "full_name": enseignant.full_name
            } if enseignant else None,
            "jour": cours.jour,
            "heure_debut": cours.heure_debut,
            "heure_fin": cours.heure_fin,
            "salle": cours.salle
        })
    
    return result

@router.put("/{cours_id}", response_model=CoursResponse)
def update_cours(
    cours_id: int,
    cours: CoursCreate,
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.SUPER_ADMIN])),
    db: Session = Depends(get_db)
):
    """Modifier un cours"""
    db_cours = db.query(Cours).filter(Cours.id == cours_id).first()
    if not db_cours:
        raise HTTPException(status_code=404, detail="Cours not found")
    
    db_cours.module_id = cours.module_id
    db_cours.groupe_id = cours.groupe_id
    db_cours.enseignant_id = cours.enseignant_id
    db_cours.jour = cours.jour
    db_cours.heure_debut = cours.heure_debut
    db_cours.heure_fin = cours.heure_fin
    db_cours.salle = cours.salle
    
    db.commit()
    db.refresh(db_cours)
    return db_cours

@router.delete("/{cours_id}")
def delete_cours(
    cours_id: int,
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.SUPER_ADMIN])),
    db: Session = Depends(get_db)
):
    """Supprimer un cours"""
    db_cours = db.query(Cours).filter(Cours.id == cours_id).first()
    if not db_cours:
        raise HTTPException(status_code=404, detail="Cours not found")
    
    db.delete(db_cours)
    db.commit()
    return {"message": "Cours deleted"}