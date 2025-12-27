from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.enseignant import Enseignant
from app.models.user import User, UserRole
from app.schemas.enseignant import EnseignantResponse
from app.utils.dependencies import require_role
from app.services.embedding_extractor import extractor
import os

router = APIRouter(prefix="/enseignants", tags=["Enseignants"])

@router.get("/pending", response_model=list[EnseignantResponse])
def get_pending_enseignants(
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.SUPER_ADMIN])),
    db: Session = Depends(get_db)
):
    """Liste des enseignants non activés"""
    pending_users = db.query(User).filter(
        User.role == UserRole.ENSEIGNANT,
        User.is_active == False
    ).all()
    
    result = []
    for user in pending_users:
        enseignant = db.query(Enseignant).filter(Enseignant.user_id == user.id).first()
        
        if enseignant:
            result.append({
                "id": enseignant.id,
                "user_id": user.id,
                "full_name": user.full_name,
                "email": user.email,
                "is_active": user.is_active,
                "photo_path": enseignant.photo_path
            })
        else:
            new_enseignant = Enseignant(user_id=user.id)
            db.add(new_enseignant)
            db.commit()
            db.refresh(new_enseignant)
            
            result.append({
                "id": new_enseignant.id,
                "user_id": user.id,
                "full_name": user.full_name,
                "email": user.email,
                "is_active": user.is_active,
                "photo_path": None
            })
    
    return result

@router.get("/active", response_model=list[EnseignantResponse])
def get_active_enseignants(
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.SUPER_ADMIN])),
    db: Session = Depends(get_db)
):
    """Liste des enseignants activés"""
    active_users = db.query(User).filter(
        User.role == UserRole.ENSEIGNANT,
        User.is_active == True
    ).all()
    
    result = []
    for user in active_users:
        enseignant = db.query(Enseignant).filter(Enseignant.user_id == user.id).first()
        if enseignant:
            result.append({
                "id": enseignant.id,
                "user_id": user.id,
                "full_name": user.full_name,
                "email": user.email,
                "is_active": user.is_active,
                "photo_path": enseignant.photo_path
            })
    
    return result

@router.post("/{enseignant_id}/upload-photo")
async def upload_enseignant_photo(
    enseignant_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.SUPER_ADMIN])),
    db: Session = Depends(get_db)
):
    """Upload photo enseignant"""
    enseignant = db.query(Enseignant).filter(Enseignant.id == enseignant_id).first()
    if not enseignant:
        raise HTTPException(status_code=404, detail="Enseignant not found")
    
    user = db.query(User).filter(User.id == enseignant.user_id).first()
    
    image_bytes = await file.read()
    embedding = extractor.extract_from_image(image_bytes)
    
    if embedding is None:
        raise HTTPException(status_code=400, detail="No face detected")
    
    os.makedirs("uploads/enseignants", exist_ok=True)
    photo_path = f"uploads/enseignants/{user.email}.jpg"
    
    with open(photo_path, "wb") as f:
        f.write(image_bytes)
    
    enseignant.photo_path = photo_path
    enseignant.embedding = embedding.tobytes()
    db.commit()
    
    return {"message": "Photo uploaded successfully"}

@router.post("/{enseignant_id}/activate")
def activate_enseignant(
    enseignant_id: int,
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.SUPER_ADMIN])),
    db: Session = Depends(get_db)
):
    """Activer enseignant"""
    enseignant = db.query(Enseignant).filter(Enseignant.id == enseignant_id).first()
    if not enseignant:
        raise HTTPException(status_code=404, detail="Enseignant not found")
    
    if not enseignant.photo_path:
        raise HTTPException(status_code=400, detail="Photo required")
    
    user = db.query(User).filter(User.id == enseignant.user_id).first()
    user.is_active = True
    db.commit()
    
    return {"message": "Enseignant activated"}

@router.delete("/{enseignant_id}")
def delete_enseignant(
    enseignant_id: int,
    current_user: User = Depends(require_role([UserRole.SUPER_ADMIN])),
    db: Session = Depends(get_db)
):
    """Supprimer enseignant"""
    enseignant = db.query(Enseignant).filter(Enseignant.id == enseignant_id).first()
    if not enseignant:
        raise HTTPException(status_code=404, detail="Enseignant not found")
    
    user = db.query(User).filter(User.id == enseignant.user_id).first()
    
    db.delete(enseignant)
    if user:
        db.delete(user)
    
    db.commit()
    return {"message": "Enseignant deleted"}