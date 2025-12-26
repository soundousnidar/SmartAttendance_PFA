from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.student import Student
from app.models.student_embedding import StudentEmbedding
from app.models.user import User, UserRole
from app.schemas.student import StudentResponse, StudentActivateRequest
from app.utils.dependencies import require_role, get_current_user
from app.services.embedding_extractor import extractor
import os

router = APIRouter(prefix="/students", tags=["Students"])

@router.get("/pending", response_model=list[StudentResponse])
def get_pending_students(
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.SUPER_ADMIN])),
    db: Session = Depends(get_db)
):
    """Liste des étudiants non activés (sans groupe)"""
    # Récupérer tous les users étudiants non activés
    pending_users = db.query(User).filter(
        User.role == UserRole.STUDENT,
        User.is_active == False
    ).all()
    
    result = []
    for user in pending_users:
        # Vérifier si student existe
        student = db.query(Student).filter(Student.user_id == user.id).first()
        
        if student:
            result.append({
                "id": student.id,
                "user_id": user.id,
                "full_name": user.full_name,
                "email": user.email,
                "is_active": user.is_active,
                "groupe_id": student.groupe_id,
                "photo_path": student.photo_path
            })
        else:
            # Créer student vide si n'existe pas
            new_student = Student(user_id=user.id)
            db.add(new_student)
            db.commit()
            db.refresh(new_student)
            
            result.append({
                "id": new_student.id,
                "user_id": user.id,
                "full_name": user.full_name,
                "email": user.email,
                "is_active": user.is_active,
                "groupe_id": None,
                "photo_path": None
            })
    
    return result

@router.get("/active", response_model=list[StudentResponse])
def get_active_students(
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.ENSEIGNANT])),
    db: Session = Depends(get_db)
):
    """Liste des étudiants activés"""
    active_users = db.query(User).filter(
        User.role == UserRole.STUDENT,
        User.is_active == True
    ).all()
    
    result = []
    for user in active_users:
        student = db.query(Student).filter(Student.user_id == user.id).first()
        if student:
            result.append({
                "id": student.id,
                "user_id": user.id,
                "full_name": user.full_name,
                "email": user.email,
                "is_active": user.is_active,
                "groupe_id": student.groupe_id,
                "photo_path": student.photo_path
            })
    
    return result

@router.post("/{student_id}/upload-photo")
async def upload_student_photo(
    student_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.SUPER_ADMIN])),
    db: Session = Depends(get_db)
):
    """Upload photo et extraction embedding"""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    user = db.query(User).filter(User.id == student.user_id).first()
    
    # Lire image
    image_bytes = await file.read()
    
    # Extraire embedding
    embedding = extractor.extract_from_image(image_bytes)
    if embedding is None:
        raise HTTPException(status_code=400, detail="No face detected in image")
    
    # Sauvegarder photo
    os.makedirs("uploads/students", exist_ok=True)
    photo_path = f"uploads/students/{user.email}.jpg"
    with open(photo_path, "wb") as f:
        f.write(image_bytes)
    
    # Mettre à jour student
    student.photo_path = photo_path
    student.embedding = embedding.tobytes()
    
    # Créer embedding vérifié
    student_emb = StudentEmbedding(
        student_id=student.id,
        embedding=embedding.tobytes(),
        is_verified=True
    )
    db.add(student_emb)
    db.commit()
    
    return {"message": "Photo uploaded successfully", "photo_path": photo_path}

@router.put("/{student_id}/assign-groupe")
def assign_groupe(
    student_id: int,
    data: StudentActivateRequest,
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.SUPER_ADMIN])),
    db: Session = Depends(get_db)
):
    """Assigner un groupe à l'étudiant"""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    student.groupe_id = data.groupe_id
    db.commit()
    
    return {"message": "Groupe assigned successfully"}

@router.post("/{student_id}/activate")
def activate_student(
    student_id: int,
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.SUPER_ADMIN])),
    db: Session = Depends(get_db)
):
    """Activer le compte de l'étudiant"""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Vérifications
    if not student.groupe_id:
        raise HTTPException(status_code=400, detail="Student must have a groupe assigned")
    
    if not student.photo_path or not student.embedding:
        raise HTTPException(status_code=400, detail="Student must have a photo uploaded")
    
    # Activer le user
    user = db.query(User).filter(User.id == student.user_id).first()
    user.is_active = True
    db.commit()
    
    return {"message": "Student activated successfully"}

@router.delete("/{student_id}")
def delete_student(
    student_id: int,
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.SUPER_ADMIN])),
    db: Session = Depends(get_db)
):
    """Supprimer un étudiant"""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Supprimer aussi le user associé
    user = db.query(User).filter(User.id == student.user_id).first()
    
    db.delete(student)
    if user:
        db.delete(user)
    
    db.commit()
    return {"message": "Student deleted"}

@router.get("/groupe/{groupe_id}", response_model=list[StudentResponse])
def get_students_by_groupe(
    groupe_id: int,
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.ENSEIGNANT])),
    db: Session = Depends(get_db)
):
    """Étudiants d'un groupe spécifique"""
    students = db.query(Student).filter(Student.groupe_id == groupe_id).all()
    
    result = []
    for student in students:
        user = db.query(User).filter(User.id == student.user_id).first()
        if user:
            result.append({
                "id": student.id,
                "user_id": user.id,
                "full_name": user.full_name,
                "email": user.email,
                "is_active": user.is_active,
                "groupe_id": student.groupe_id,
                "photo_path": student.photo_path
            })
    
    return result