from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.student import Student
from app.models.student_embedding import StudentEmbedding
from app.models.user import User, UserRole
from app.schemas.student import StudentResponse, StudentActivateRequest
from app.utils.dependencies import require_role, get_current_user
from app.services.embedding_extractor import extractor
from app.services.presence_service import calculate_presence_percentage
from datetime import date, datetime, time
from typing import cast
import os
import logging

logger = logging.getLogger(__name__) # logger: do not configure handlers here, use app logging config

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
            presence = calculate_presence_percentage(student.id, db)
            result.append({
                "id": student.id,
                "user_id": user.id,
                "groupe_id": student.groupe_id,
                "photo_path": student.photo_path,
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "full_name": user.full_name,
                    "is_active": user.is_active
                },
                "presence_percentage": presence
            })
        else:
            # Créer student vide si n'existe pas
            new_student = Student(user_id=user.id)
            db.add(new_student)
            db.commit()
            db.refresh(new_student)
            presence = calculate_presence_percentage(new_student.id, db)
            result.append({
                "id": new_student.id,
                "user_id": user.id,
                "groupe_id": None,
                "photo_path": None,
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "full_name": user.full_name,
                    "is_active": user.is_active
                },
                "presence_percentage": presence
            })
    
    return result

@router.get("/active", response_model=list[StudentResponse])
def get_active_students(
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.ENSEIGNANT])),
    db: Session = Depends(get_db)
):
    """Liste des étudiants activés"""
    # UTILISER joinedload pour charger user en une seule requête
    from sqlalchemy.orm import joinedload
    
    students = db.query(Student).options(
        joinedload(Student.user)
    ).join(User).filter(
        User.is_active == True,
        User.role == UserRole.STUDENT
    ).all()
    
    result = []
    for s in students:
        # Skip if user relationship is missing
        if not getattr(s, "user", None):
            logger.warning("Orphan Student detected in /students/active: student_id=%s user_id=%s", s.id, s.user_id)
            continue
        presence = calculate_presence_percentage(s.id, db)
        result.append({
            "id": s.id,
            "user_id": s.user_id,
            "groupe_id": getattr(s, "groupe_id", None),
            "photo_path": getattr(s, "photo_path", None),
            "user": {
                "id": s.user.id,
                "email": s.user.email,
                "full_name": s.user.full_name,
                "is_active": s.user.is_active
            },
            "presence_percentage": presence
        })
    
    return result


@router.get('/admin/orphan-students')
def get_orphan_students(
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.SUPER_ADMIN])),
    db: Session = Depends(get_db)
):
    """Return students whose `user_id` has no matching User (for debugging/cleanup)."""
    # Outer join with User and filter where User.id is None
    from sqlalchemy import and_, or_, not_
    orphans = db.query(Student).outerjoin(User, Student.user_id == User.id).filter(User.id == None).all()
    result = [{"student_id": s.id, "user_id": s.user_id} for s in orphans]
    if result:
        logger.warning("Found %s orphaned students", len(result))
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
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
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
    
    # Mettre à jour student (use setattr for type-checker safety)
    setattr(student, "photo_path", photo_path)
    setattr(student, "embedding", embedding.tobytes())
    
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
    
    if student.photo_path is None or student.embedding is None:
        raise HTTPException(status_code=400, detail="Student must have a photo uploaded")

    # Activer le user
    user = db.query(User).filter(User.id == student.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    setattr(user, "is_active", True)
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
        if not user:
            logger.warning("Orphan Student detected in /students/groupe/%s: student_id=%s user_id=%s", groupe_id, student.id, student.user_id)
            continue
        presence = calculate_presence_percentage(student.id, db)
        result.append({
            "id": student.id,
            "user_id": user.id,
            "groupe_id": student.groupe_id,
            "photo_path": student.photo_path,
            "user": {
                "id": user.id,
                "email": user.email,
                "full_name": user.full_name,
                "is_active": user.is_active
            },
            "presence_percentage": presence
        })
    
    return result

@router.get("/me/stats")
async def get_student_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Récupérer les statistiques d'un étudiant"""
    
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Access forbidden")
    
    # Trouver l'étudiant
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Récupérer toutes les présences
    from app.models.attendance import Attendance
    attendances = db.query(Attendance).filter(
        Attendance.student_id == student.id
    ).all()
    
    total_cours = len(attendances)
    presences = sum(1 for a in attendances if str(a.status).lower() == "present")
    absences = sum(1 for a in attendances if str(a.status).lower() == "absent")
    retards = sum(1 for a in attendances if str(a.status).lower() == "retard")
    
    taux_presence = round((presences / total_cours * 100) if total_cours > 0 else 0, 1)
    
    return {
        "totalCours": total_cours,
        "presences": presences,
        "absences": absences,
        "retards": retards,
        "tauxPresence": taux_presence
    }


@router.get("/me/schedule")
async def get_student_schedule(
    week: int = 0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Récupérer l'emploi du temps d'un étudiant"""
    from datetime import datetime, timedelta
    
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Access forbidden")
    
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Calculer les dates de la semaine
    today = datetime.now()
    start_of_week = today - timedelta(days=today.weekday()) + timedelta(weeks=week)
    end_of_week = start_of_week + timedelta(days=6)
    
    # Récupérer les séances
    from app.models.seance import Seance
    from app.models.cours import Cours
    
    seances = db.query(Seance).join(Cours).filter(
        Cours.groupe_id == student.groupe_id,
        Seance.date >= start_of_week.date(),
        Seance.date <= end_of_week.date()
    ).all()
    
    schedule = []
    day_mapping = {
        0: "Lundi", 1: "Mardi", 2: "Mercredi",
        3: "Jeudi", 4: "Vendredi", 5: "Samedi", 6: "Dimanche"
    }
    
    color_mapping = {
        "Développement Web": "bg-blue-500",
        "Base de Données": "bg-green-500",
        "Algorithmique": "bg-purple-500",
        "Réseaux": "bg-orange-500",
        "Sécurité": "bg-red-500",
        "Anglais": "bg-indigo-500"
    }
    
    for seance in seances:
        cours = seance.cours
        module = cours.module if cours else None
        enseignant = cours.enseignant if cours else None
        
        schedule.append({
            "id": seance.id,
            "courseName": module.nom if module else "Cours",
            "module": module.nom if module else "N/A",
            "professor": enseignant.full_name if enseignant else "N/A",
            "room": cours.salle if cours else "N/A",
            "startTime": seance.heure_debut.strftime("%H:%M") if seance.heure_debut is not None else "08:00",
            "endTime": seance.heure_fin.strftime("%H:%M") if seance.heure_fin is not None else "10:00",
            "day": day_mapping.get(seance.date.weekday(), "Lundi"),
            "color": color_mapping.get(module.nom if module else "", "bg-gray-500")
        })
    
    return schedule

@router.get("/me/attendance")
async def get_student_attendance(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Récupérer l'historique des présences"""
    
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Access forbidden")
    
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    from app.models.attendance import Attendance
    from app.models.seance import Seance
    attendances = db.query(Attendance).filter(
        Attendance.student_id == student.id
    ).all()
    
    records = []
    for attendance in attendances:
        seance = attendance.seance
        if seance:
            cours = seance.cours
            module = cours.module if cours else None
            enseignant = cours.enseignant if cours else None
            
            records.append({
                "id": attendance.id,
                "courseName": module.nom if module else "Cours",  # ← CHANGÉ ICI
                "module": module.nom if module else "N/A",
                "date": seance.date.isoformat() if seance.date is not None else None,
                "startTime": seance.heure_debut.strftime("%H:%M") if seance.heure_debut is not None else "N/A",
                "endTime": seance.heure_fin.strftime("%H:%M") if seance.heure_fin is not None else "N/A",
                "status": attendance.status.lower(),  # ← Convertir en minuscule
                "professor": enseignant.full_name if enseignant else "N/A",
                "room": cours.salle if cours else "N/A"
            })
    
    total = len(records)
    present = len([r for r in records if r["status"] == "present"])
    absent = len([r for r in records if r["status"] == "absent"])
    late = len([r for r in records if r["status"] == "retard"])
    rate = round((present / total * 100) if total > 0 else 0)
    
    return {
        "records": records,
        "stats": {
            "totalSessions": total,
            "present": present,
            "absent": absent,
            "late": late,
            "attendanceRate": rate
        }
    }


@router.get("/me/recent-courses")
async def get_recent_courses(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Récupérer les cours récents pour le dashboard"""
    from datetime import datetime, timedelta
    
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Access forbidden")
    
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    from app.models.seance import Seance
    from app.models.cours import Cours
    from app.models.attendance import Attendance
    
    today = datetime.now().date()
    seances = db.query(Seance).join(Cours).filter(
        Cours.groupe_id == student.groupe_id,
        Seance.date <= today + timedelta(days=7)
    ).order_by(Seance.date.desc()).limit(10).all()
    
    courses = []
    for seance in seances:
        cours = seance.cours
        module = cours.module if cours else None
        enseignant = cours.enseignant if cours else None
        
        attendance = db.query(Attendance).filter(
            Attendance.seance_id == seance.id,
            Attendance.student_id == student.id
        ).first()
        
        status = "a_venir"
        
        seance_date = cast(datetime, seance.date).date()

        if attendance is not None:
            status = attendance.status
        elif seance_date < today:
            status = "absent"
        else:
            status = "en_cours"

        heure_debut = cast(time | None, seance.heure_debut)
        heure_fin = cast(time | None, seance.heure_fin)        
        courses.append({
            "id": seance.id,
            "nom": cours.nom if cours else "N/A",
            "module": module.nom if module else "N/A",
            "date": seance.date.isoformat(),
            "heure": (f"{heure_debut.strftime('%H:%M') if heure_debut else '08:00'} - "
                      f"{heure_fin.strftime('%H:%M') if heure_fin else '10:00'}"),
            "salle": seance.salle or "N/A",
            "professeur": enseignant.nom_complet if enseignant else "N/A",
            "status": status
        })
    
    return courses