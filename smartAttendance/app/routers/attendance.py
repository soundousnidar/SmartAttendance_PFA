from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from datetime import datetime, time, timedelta
from app.database import get_db
from app.models.attendance import Attendance, AttendanceStatus
from app.models.seance import Seance
from app.models.cours import Cours
from app.models.student import Student
from app.models.user import User, UserRole
from app.schemas.attendance import AttendanceResponse
from app.utils.dependencies import require_role
from app.services.embedding_extractor import extractor
import numpy as np
import traceback

router = APIRouter(prefix="/attendance", tags=["Attendance"])

def calculate_attendance_status(cours: Cours, current_time: time) -> AttendanceStatus:
    """
    Calculer le statut de présence selon l'heure
    
    Cours: 08:00 - 10:00
    - 08:00 - 08:30 : PRESENT
    - 08:30 - 10:00 : LATE
    - Après 10:00   : ABSENT (ne peut pas enregistrer)
    """
    # Convertir time en minutes depuis minuit pour faciliter les calculs
    def time_to_minutes(t: time) -> int:
        return t.hour * 60 + t.minute
    
    current_minutes = time_to_minutes(current_time)
    debut_minutes = time_to_minutes(cours.heure_debut)
    fin_minutes = time_to_minutes(cours.heure_fin)
    
    # Seuil de retard : 30 minutes après le début
    late_threshold_minutes = debut_minutes + 30
    
    if current_minutes < debut_minutes:
        # Trop tôt (avant le début du cours)
        return None
    elif current_minutes <= late_threshold_minutes:
        # À l'heure (dans les 30 premières minutes)
        return AttendanceStatus.PRESENT
    elif current_minutes <= fin_minutes:
        # En retard (après 30 min mais avant la fin)
        return AttendanceStatus.LATE
    else:
        # Trop tard (après la fin du cours)
        return None

@router.post("/mark/{seance_id}", response_model=AttendanceResponse)
async def mark_attendance(
    seance_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Enregistrer présence avec détection automatique du statut (présent/retard)
    """
    try:
        # Vérifier que la séance existe et est active
        seance = db.query(Seance).filter(Seance.id == seance_id).first()
        if not seance:
            raise HTTPException(status_code=404, detail="Séance not found")
        
        if not seance.is_active:
            raise HTTPException(status_code=400, detail="Séance is closed")
        
        # Récupérer le cours associé
        cours = db.query(Cours).filter(Cours.id == seance.cours_id).first()
        if not cours:
            raise HTTPException(status_code=404, detail="Cours not found")
        
        # Vérifier l'heure actuelle
        current_time = datetime.now().time()
        
        # Calculer le statut selon l'heure
        status = calculate_attendance_status(cours, current_time)
        
        if status is None:
            # Hors plage horaire
            if current_time < cours.heure_debut:
                raise HTTPException(
                    status_code=400,
                    detail=f"Le cours commence à {cours.heure_debut}. Trop tôt pour marquer la présence."
                )
            else:
                raise HTTPException(
                    status_code=400,
                    detail=f"Le cours s'est terminé à {cours.heure_fin}. Présence non enregistrée."
                )
        
        # Extraire l'embedding de l'image
        image_bytes = await file.read()
        embedding = extractor.extract_from_image(image_bytes)
        
        if embedding is None:
            raise HTTPException(status_code=400, detail="No face detected in image")
        
        # Reconnaissance faciale
        from sqlalchemy.orm import joinedload
        students = db.query(Student).options(joinedload(Student.user)).all()
        
        best_match = None
        min_distance = float('inf')
        
        for student in students:
            if student.embedding:
                try:
                    stored_emb = np.frombuffer(student.embedding, dtype=np.float32)
                    
                    if stored_emb.shape != embedding.shape:
                        continue
                    
                    distance = np.linalg.norm(embedding - stored_emb)
                    
                    if distance < min_distance:
                        min_distance = distance
                        best_match = student
                except Exception as e:
                    print(f"Error comparing with student {student.id}: {e}")
                    continue
        
        threshold = 0.9
        
        if min_distance > threshold:
            raise HTTPException(
                status_code=404,
                detail=f"Étudiant non reconnu (distance: {min_distance:.2f})"
            )
        
        confidence = max(0.0, 1 - (min_distance / threshold))
        
        # Vérifier si déjà marqué présent
        existing = db.query(Attendance).filter(
            Attendance.seance_id == seance_id,
            Attendance.student_id == best_match.id
        ).first()
        
        if existing:
            raise HTTPException(
                status_code=400,
                detail=f"Présence déjà enregistrée ({existing.status})"
            )
        
        # Enregistrer la présence avec le statut
        attendance = Attendance(
            seance_id=seance_id,
            student_id=best_match.id,
            status=status,
            confidence=float(confidence)
        )
        
        db.add(attendance)
        db.commit()
        db.refresh(attendance)
        
        return attendance
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in mark_attendance: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")

@router.get("/seance/{seance_id}", response_model=list[AttendanceResponse])
def get_attendance_by_seance(
    seance_id: int,
    current_user: User = Depends(require_role([UserRole.ENSEIGNANT, UserRole.ADMIN, UserRole.SUPER_ADMIN])),
    db: Session = Depends(get_db)
):
    """Liste des présences d'une séance"""
    return db.query(Attendance).filter(Attendance.seance_id == seance_id).all()

@router.get("/student/{student_id}", response_model=list[AttendanceResponse])
def get_attendance_by_student(
    student_id: int,
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.ENSEIGNANT])),
    db: Session = Depends(get_db)
):
    """Historique des présences d'un étudiant"""
    return db.query(Attendance).filter(Attendance.student_id == student_id).all()