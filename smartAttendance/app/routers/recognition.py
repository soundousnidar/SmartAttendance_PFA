from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.attendance import Attendance, AttendanceStatus
from app.models.seance import Seance
from app.models.student import Student
from app.models.student_embedding import StudentEmbedding
from app.models.user import User, UserRole
from app.schemas.attendance import AttendanceResponse
from app.utils.dependencies import require_role
from app.services.embedding_extractor import extractor
import numpy as np
import traceback
from datetime import datetime, time, timedelta

router = APIRouter(prefix="/recognition", tags=["Recognition"])

def get_student_name(student: Student, db: Session = None) -> str:
    """
    Récupère le nom de l'étudiant via la relation user
    """
    try:
        if hasattr(student, 'user') and student.user:
            return student.user.full_name
        
        if db and student.user_id:
            from app.models.user import User
            user = db.query(User).filter(User.id == student.user_id).first()
            if user:
                return user.full_name
        
        return f"Student {student.id}"
    except Exception as e:
        print(f"Error getting student name: {e}")
        return f"Student {student.id}"


def calculate_attendance_status(seance: Seance) -> dict:
    """
    Calcule si la détection est autorisée et le statut de présence
    
    Règles:
    - Détection démarre à heure_debut du cours
    - Présent: de heure_debut à heure_debut + 30 min
    - Retard: de heure_debut + 30 min à heure_fin
    - Après heure_fin: détection fermée
    
    Returns:
        {
            "can_detect": bool,
            "status": AttendanceStatus ou None,
            "message": str
        }
    """
    now = datetime.now()
    current_time = now.time()
    
    # Récupérer les heures du cours
    heure_debut = seance.heure_debut
    heure_fin = seance.heure_fin
    
    if not heure_debut or not heure_fin:
        return {
            "can_detect": False,
            "status": None,
            "message": "Séance sans horaires définis"
        }
    
    # Convertir time en datetime pour calculs
    today = now.date()
    dt_debut = datetime.combine(today, heure_debut)
    dt_fin = datetime.combine(today, heure_fin)
    dt_limite_retard = dt_debut + timedelta(minutes=30)
    dt_now = datetime.combine(today, current_time)
    
    # Vérifier si avant le début du cours
    if dt_now < dt_debut:
        minutes_avant = int((dt_debut - dt_now).total_seconds() / 60)
        return {
            "can_detect": False,
            "status": None,
            "message": f"Le cours commence dans {minutes_avant} minutes à {heure_debut.strftime('%H:%M')}"
        }
    
    # Vérifier si après la fin du cours
    if dt_now > dt_fin:
        return {
            "can_detect": False,
            "status": None,
            "message": f"Le cours est terminé (fin à {heure_fin.strftime('%H:%M')})"
        }
    
    # Pendant le cours: déterminer le statut
    if dt_now <= dt_limite_retard:
        # Présent (dans les 30 premières minutes)
        return {
            "can_detect": True,
            "status": AttendanceStatus.PRESENT,
            "message": "Présent"
        }
    else:
        # En retard (après 30 minutes mais avant la fin)
        return {
            "can_detect": True,
            "status": AttendanceStatus.LATE,
            "message": "En retard"
        }


@router.post("/detect-face")
async def detect_face(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Endpoint simplifié pour détecter et reconnaître un visage
    sans nécessiter de seance_id
    """
    try:
        image_bytes = await file.read()
        
        if len(image_bytes) == 0:
            raise HTTPException(status_code=400, detail="Empty image file")
        
        print(f"📦 Received image: {len(image_bytes)} bytes")
        
        embedding = extractor.extract_from_image(image_bytes)
        
        if embedding is None:
            return {
                "error": "No face detected or face quality too low"
            }
        
        print(f"✅ Embedding extracted: shape {embedding.shape}")
        
        from sqlalchemy.orm import joinedload
        students = db.query(Student).options(joinedload(Student.user)).all()
        
        if not students:
            return {
                "error": "No students in database"
            }
        
        print(f"🔍 Comparing with {len(students)} students")
        
        best_match = None
        min_distance = float('inf')
        
        for student in students:
            if student.embedding:
                try:
                    stored_emb = np.frombuffer(student.embedding, dtype=np.float32)
                    
                    if stored_emb.shape != embedding.shape:
                        print(f"⚠️ Shape mismatch for student {student.id}: {stored_emb.shape} vs {embedding.shape}")
                        continue
                    
                    distance = np.linalg.norm(embedding - stored_emb)
                    
                    print(f"  Student {student.id}: distance = {distance:.3f}")
                    
                    if distance < min_distance:
                        min_distance = distance
                        best_match = student
                except Exception as e:
                    print(f"⚠️ Error comparing with student {student.id}: {e}")
                    continue
        
        if best_match is None:
            return {
                "error": "No valid embeddings found in database"
            }
        
        threshold = 0.9
        
        print(f"🎯 Best match: Student {best_match.id}, distance = {min_distance:.3f}")
        
        if min_distance > threshold:
            return {
                "error": f"Student not recognized (distance: {min_distance:.2f} > threshold: {threshold})"
            }
        
        confidence = max(0.0, 1 - (min_distance / threshold))
        
        student_name = get_student_name(best_match, db)
        
        return {
            "student_id": best_match.id,
            "student_name": student_name,
            "confidence": float(confidence),
            "distance": float(min_distance),
            "threshold": threshold
        }
    
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"❌ Error in detect_face: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")


@router.post("/recognize/{seance_id}", response_model=AttendanceResponse)
async def recognize_student(
    seance_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(require_role([UserRole.ENSEIGNANT, UserRole.ADMIN, UserRole.SUPER_ADMIN])),
    db: Session = Depends(get_db)
):
    """
    Endpoint complet pour reconnaître et enregistrer la présence avec logique temporelle
    """
    try:
        seance = db.query(Seance).filter(Seance.id == seance_id).first()
        if not seance:
            raise HTTPException(status_code=404, detail="Séance not found")
        
        if not seance.is_active:
            raise HTTPException(status_code=400, detail="Cette séance est terminée")
        
        # VÉRIFIER L'HEURE ET LE STATUT
        status_info = calculate_attendance_status(seance)
        
        if not status_info["can_detect"]:
            raise HTTPException(
                status_code=400, 
                detail=status_info["message"]
            )
        
        # Extraire embedding
        image_bytes = await file.read()
        embedding = extractor.extract_from_image(image_bytes)
        if embedding is None:
            raise HTTPException(status_code=400, detail="No face detected")
        
        # Comparer avec tous les étudiants
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
        
        if min_distance > 0.9:
            raise HTTPException(status_code=404, detail="Student not recognized")
        
        confidence = 1 - min_distance
        
        # Vérifier si déjà présent
        existing = db.query(Attendance).filter(
            Attendance.seance_id == seance_id,
            Attendance.student_id == best_match.id
        ).first()
        
        if existing:
            raise HTTPException(
                status_code=400, 
                detail=f"Déjà marqué(e) comme {existing.status}"
            )
        
        # Enregistrer présence AVEC LE STATUT
        attendance = Attendance(
            seance_id=seance_id,
            student_id=best_match.id,
            confidence=float(confidence),
            status=status_info["status"]
        )
        db.add(attendance)
        
        # Sauvegarder embedding pour apprentissage
        new_emb = StudentEmbedding(
            student_id=best_match.id,
            embedding=embedding.tobytes(),
            is_verified=False
        )
        db.add(new_emb)
        
        db.commit()
        db.refresh(attendance)
        
        print(f"✅ Attendance recorded: Student {best_match.id} - Status: {status_info['status']}")
        
        return attendance
    
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Error in recognize_student: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")


@router.get("/seance/{seance_id}/status")
def get_seance_detection_status(
    seance_id: int,
    current_user: User = Depends(require_role([UserRole.ENSEIGNANT, UserRole.ADMIN, UserRole.SUPER_ADMIN])),
    db: Session = Depends(get_db)
):
    """
    Vérifier si la détection est possible pour une séance
    """
    seance = db.query(Seance).filter(Seance.id == seance_id).first()
    if not seance:
        raise HTTPException(status_code=404, detail="Séance not found")
    
    status_info = calculate_attendance_status(seance)
    
    return {
        "seance_id": seance_id,
        "is_active": seance.is_active,
        "can_detect": status_info["can_detect"],
        "current_status": status_info["status"],
        "message": status_info["message"],
        "heure_debut": seance.heure_debut.strftime('%H:%M') if seance.heure_debut else None,
        "heure_fin": seance.heure_fin.strftime('%H:%M') if seance.heure_fin else None,
        "current_time": datetime.now().strftime('%H:%M:%S')
    }


@router.get("/attendances/seance/{seance_id}", response_model=list[AttendanceResponse])
def get_attendances_by_seance(
    seance_id: int,
    current_user: User = Depends(require_role([UserRole.ENSEIGNANT, UserRole.ADMIN, UserRole.SUPER_ADMIN])),
    db: Session = Depends(get_db)
):
    return db.query(Attendance).filter(Attendance.seance_id == seance_id).all()


@router.get("/debug/students")
def debug_students(db: Session = Depends(get_db)):
    """
    Endpoint de debug pour voir les étudiants et leurs attributs
    """
    from app.models.user import User
    
    students = db.query(Student).all()
    
    result = []
    for student in students:
        user = db.query(User).filter(User.id == student.user_id).first()
        
        student_info = {
            "id": student.id,
            "user_id": student.user_id,
            "has_embedding": student.embedding is not None,
            "embedding_size": len(student.embedding) if student.embedding else 0,
            "full_name": user.full_name if user else "Unknown",
            "email": user.email if user else "Unknown"
        }
        
        result.append(student_info)
    
    return {
        "total": len(students),
        "students": result
    }