from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from typing import Optional
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app.models.enseignant import Enseignant
from app.models.user import User, UserRole
from app.models.cours import Cours  # Assure-toi que ce modèle existe
from app.models.seance import Seance
from app.models.groupe import Groupe
from app.models.attendance import Attendance
from app.models.student import Student
from app.models.notification import Notification
from app.models.module import Module
from app.schemas.enseignant import EnseignantResponse
from app.schemas.student import StudentResponse  # ← On utilise TON schema existant
from app.schemas.dashboard import TeacherDashboardResponse  # Tu l'as créé ?
from app.schemas.schedule import ScheduleResponse  # Tu l'as créé ?
from app.schemas.seance import SeanceResponse  # On va le créer simplement
from app.schemas.notification import NotificationResponse
from app.utils.dependencies import require_role
from app.services.embedding_extractor import extractor
from app.services.presence_service import calculate_presence_percentage  # Existe maintenant
from datetime import datetime, date, timedelta
from typing import Optional, List
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
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
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
    
    if enseignant.photo_path is None:
        raise HTTPException(status_code=400, detail="Photo required")
    
    user = db.query(User).filter(User.id == enseignant.user_id).first()

    if user is None:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")

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

# Nouveaux endpoints pour le dashboard enseignant
@router.get("/dashboard")
async def get_teacher_dashboard(
    current_user: User = Depends(require_role([UserRole.ENSEIGNANT])),
    db: Session = Depends(get_db)
):
    enseignant = db.query(Enseignant).filter(Enseignant.user_id == current_user.id).first()
    if not enseignant:
        raise HTTPException(status_code=404, detail="Enseignant not found")

    today = date.today()
    now = datetime.now()
    week_start = today - timedelta(days=today.weekday())
    week_end = week_start + timedelta(days=6)

    # 1. Stats globales - Compter les séances (pas les cours)
    seances_semaine = db.query(Seance).join(Cours).filter(
        Cours.enseignant_id == enseignant.id,
        Seance.date >= week_start,
        Seance.date <= week_end
    ).count()

    seances_aujourdhui = db.query(Seance).join(Cours).filter(
        Cours.enseignant_id == enseignant.id,
        Seance.date == today
    ).all()
    cours_aujourdhui_count = len(set(s.cours_id for s in seances_aujourdhui))

    # Total étudiants suivis (distinct via groupes)
    groupes_ids = [gid for (gid,) in db.query(Cours.groupe_id).filter(Cours.enseignant_id == enseignant.id).distinct().all()]
    total_etudiants = db.query(Student).filter(Student.groupe_id.in_(groupes_ids)).count() if groupes_ids else 0

    # 2. Cours du jour avec présence
    cours_aujourdhui_list = []
    cours_ids_today = set(s.cours_id for s in seances_aujourdhui)
    
    for cours_id in cours_ids_today:
        c = db.query(Cours).options(joinedload(Cours.module), joinedload(Cours.groupe)).filter(Cours.id == cours_id).first()
        if not c:
            continue
            
        seances_today = [s for s in seances_aujourdhui if s.cours_id == cours_id]
        
        total_presents = 0
        total_retards = 0
        total_absents = 0
        total_inscrits = 0

        # Calculer total étudiants du groupe
        groupe = db.query(Groupe).filter(Groupe.id == c.groupe_id).first()
        if groupe:
            total_inscrits = db.query(Student).filter(Student.groupe_id == groupe.id).count()

        for s in seances_today:
            attendances = db.query(Attendance).filter(Attendance.seance_id == s.id).all()
            total_presents += sum(1 for a in attendances if a.status.lower() == "present")
            total_retards += sum(1 for a in attendances if a.status.lower() == "late")
        
        total_absents = max(0, total_inscrits - total_presents - total_retards)

        # Obtenir module et groupe
        module = db.query(Module).filter(Module.id == c.module_id).first()
        groupe = db.query(Groupe).filter(Groupe.id == c.groupe_id).first()
        
        module_nom = module.nom if module else "N/A"
        module_niveau = module.annee if module else 0
        groupe_code = groupe.code if groupe else "N/A"
        
        cours_aujourdhui_list.append({
            "id": c.id,
            "heure": f"{c.heure_debut.strftime('%H:%M')} - {c.heure_fin.strftime('%H:%M')}",
            "cours": module_nom,  # Frontend expects "cours"
            "niveau": module_niveau,
            "groupe": groupe_code,
            "salle": c.salle or "",
            "presents": total_presents,
            "retards": total_retards,
            "absents": total_absents,
            "total": total_inscrits
        })

    # 3. Évolution présence semaine (5 derniers jours)
    evolution = []
    for i in range(4, -1, -1):
        day = today - timedelta(days=i)
        day_seances = db.query(Seance).join(Cours).filter(
            Cours.enseignant_id == enseignant.id,
            Seance.date == day
        ).all()
        
        if not day_seances:
            evolution.append(0)
            continue
            
        day_presents = 0
        day_total = 0
        
        for ds in day_seances:
            cours = db.query(Cours).filter(Cours.id == ds.cours_id).first()
            if not cours:
                continue
                
            # Compter étudiants du groupe
            groupe = db.query(Groupe).filter(Groupe.id == cours.groupe_id).first()
            if groupe:
                groupe_students = db.query(Student).filter(Student.groupe_id == groupe.id).count()
                day_total += groupe_students
                
            att = db.query(Attendance).filter(Attendance.seance_id == ds.id).all()
            day_presents += sum(1 for a in att if a.status.lower() == "present")
        
        evolution.append(round((day_presents / day_total * 100) if day_total > 0 else 0, 1))

    # 4. Taux présence par cours (les 5 principaux)
    cours_list = db.query(Cours).filter(Cours.enseignant_id == enseignant.id).limit(5).all()
    taux_par_cours = []
    for c in cours_list:
        module = db.query(Module).filter(Module.id == c.module_id).first()
        groupe = db.query(Groupe).filter(Groupe.id == c.groupe_id).first()
        
        seances = db.query(Seance).filter(Seance.cours_id == c.id).all()
        presents = 0
        total = 0
        
        # Compter étudiants du groupe
        if groupe:
            groupe_students = db.query(Student).filter(Student.groupe_id == groupe.id).count()
            total = groupe_students * len(seances) if seances else 0
        
        for s in seances:
            att = db.query(Attendance).filter(Attendance.seance_id == s.id).all()
            presents += sum(1 for a in att if a.status.lower() == "present")
            
        taux = round((presents / total * 100) if total > 0 else 0, 1)
        module_nom = module.nom if module else "N/A"
        module_niveau = module.annee if module else 0
        groupe_code = groupe.code if groupe else "N/A"
        
        taux_par_cours.append({
            "cours": f"{module_nom} (L{module_niveau}-{groupe_code})",
            "taux": taux
        })

    # 5. Étudiants à risque (< 75% présence)
    students = db.query(Student).options(joinedload(Student.user), joinedload(Student.groupe)).join(Cours, Student.groupe_id == Cours.groupe_id).filter(
        Cours.enseignant_id == enseignant.id
    ).distinct().limit(10).all()
    
    etudiants_risque = []
    for s in students:
        if not s.groupe_id:
            continue
            
        # Compter séances pour cet étudiant via ses groupes
        seances_count = db.query(Seance).join(Cours).filter(
            Cours.enseignant_id == enseignant.id,
            Cours.groupe_id == s.groupe_id
        ).count()
        
        if seances_count == 0:
            continue
            
        presents_count = db.query(Attendance).join(Seance).join(Cours).filter(
            Cours.enseignant_id == enseignant.id,
            Attendance.student_id == s.id,
            Attendance.status.ilike("present")
        ).count()
        
        taux = round((presents_count / seances_count * 100) if seances_count > 0 else 0, 1)
        if taux < 75:
            groupe = db.query(Groupe).filter(Groupe.id == s.groupe_id).first()
            niveau_str = f"{groupe.annee}ème année" if groupe else "N/A"
            
            etudiants_risque.append({
                "nom": s.user.full_name if s.user else "N/A",
                "cours": "Multiples",
                "niveau": niveau_str,
                "absences": seances_count - presents_count,
                "taux_presence": taux
            })

    # Taux moyen global
    taux_moyen = sum(t["taux"] for t in taux_par_cours) / len(taux_par_cours) if taux_par_cours else 0

    return {
        "stats": {
            "total_cours_semaine": seances_semaine,  # Frontend expects totalCoursSemaine
            "cours_aujourdhui": cours_aujourdhui_count,  # Frontend expects coursAujourdhui
            "total_etudiants": total_etudiants,  # Frontend expects totalEtudiantsSuivis
            "taux_presence_moyen": round(taux_moyen, 1)  # Frontend expects tauxPresenceMoyen
        },
        "cours_aujourdhui": cours_aujourdhui_list,
        "evolution_presence": evolution[::-1],  # Du lundi au vendredi
        "taux_presence_par_cours": taux_par_cours,
        "etudiants_a_risque": etudiants_risque[:5]
    }
    
# 2. Emploi du temps filtré
@router.get("/schedule")
async def get_teacher_schedule(
    filiere: Optional[str] = Query(None),
    niveau: Optional[int] = Query(None),
    groupe: Optional[str] = Query(None),
    current_user: User = Depends(require_role([UserRole.ENSEIGNANT])),
    db: Session = Depends(get_db)
):
    query = db.query(Cours).filter(Cours.enseignant_id == current_user.id)
    
    cours = query.all()
    
    result = []
    for c in cours:
        module = db.query(Module).filter(Module.id == c.module_id).first()
        groupe_obj = db.query(Groupe).filter(Groupe.id == c.groupe_id).first()
        
        if not module or not groupe_obj:
            continue
        
        # Get filiere from module or groupe
        from app.models.filiere import Filiere
        filiere_obj = db.query(Filiere).filter(Filiere.id == module.filiere_id).first()
        filiere_code = filiere_obj.code if filiere_obj else "N/A"
        
        # Apply filters
        if filiere and filiere_code.lower() != filiere.lower():
            continue
        if niveau and module.annee != niveau:
            continue
        if groupe and groupe_obj.code.lower() != groupe.lower():
            continue
        
        result.append({
            "jour": c.jour.value if hasattr(c.jour, 'value') else str(c.jour),
            "plage": f"{c.heure_debut.strftime('%H:%M')} - {c.heure_fin.strftime('%H:%M')}",
            "module": module.nom,
            "cours": module.nom,  # Alias pour compatibilité
            "professeur": current_user.full_name,
            "salle": c.salle or "",
            "filiere": filiere_code,
            "niveau": module.annee,
            "groupe": groupe_obj.code
        })
    
    return result

# 3. Liste des étudiants (utilise TON StudentResponse)
@router.get("/students", response_model=list[StudentResponse])
async def get_teacher_students(
    filiere: Optional[str] = Query(None),
    niveau: Optional[int] = Query(None),
    groupe: Optional[str] = Query(None),
    current_user: User = Depends(require_role([UserRole.ENSEIGNANT])),
    db: Session = Depends(get_db)
):
    enseignant = db.query(Enseignant).filter(Enseignant.user_id == current_user.id).first()
    if not enseignant:
        raise HTTPException(status_code=404, detail="Enseignant not found")
    
    # Ensure the user relationship is loaded to avoid None values
    query = db.query(Student).options(joinedload(Student.user)).join(Cours).filter(Cours.enseignant_id == enseignant.id).distinct()
    
    if filiere:
        query = query.filter(Student.filiere.ilike(f"%{filiere}%"))
    if niveau:
        query = query.filter(Student.niveau == niveau)
    if groupe:
        query = query.filter(Student.groupe.ilike(f"%{groupe}%"))
    
    students = query.all()
    
    # Ajoute presence_percentage dynamiquement (construit dicts pour éviter attributs sur None)
    result = []
    for s in students:
        # Skip if user relationship is missing
        if not getattr(s, "user", None):
            import logging
            logger = logging.getLogger(__name__)
            logger.warning("Orphan Student detected in /enseignants/students: student_id=%s user_id=%s", s.id, s.user_id)
            continue
        percentage = calculate_presence_percentage(s.id, db)
        student_dict = {
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
            "presence_percentage": percentage
        }
        result.append(StudentResponse(**student_dict))
    
    return result

# 4. Séances + séance en cours
@router.get("/seances/current")
async def get_current_seance(
    current_user: User = Depends(require_role([UserRole.ENSEIGNANT])),
    db: Session = Depends(get_db)
):
    now = datetime.now()
    enseignant = db.query(Enseignant).filter(Enseignant.user_id == current_user.id).first()
    if not enseignant:
        raise HTTPException(status_code=404, detail="Enseignant not found")
    
    current = db.query(Seance).join(Cours).filter(
        Cours.enseignant_id == enseignant.id,
        Seance.date == now.date(),
        Seance.heure_debut <= now.time(),
        Seance.heure_fin >= now.time()
    ).first()
    
    if not current:
        return None
    
    attendances = db.query(Attendance).filter(Attendance.seance_id == current.id).all()
    presents = len([a for a in attendances if a.status.lower() == "present"])
    retards = len([a for a in attendances if a.status.lower() == "late"])
    
    # Calculate total students from groupe
    cours = db.query(Cours).filter(Cours.id == current.cours_id).first()
    total_etudiants = 0
    if cours:
        groupe = db.query(Groupe).filter(Groupe.id == cours.groupe_id).first()
        if groupe:
            total_etudiants = db.query(Student).filter(Student.groupe_id == groupe.id).count()
    
    absents = max(0, total_etudiants - presents - retards)
    
    return {
        "seance": SeanceResponse.from_orm(current),
        "presents": presents,
        "retards": retards,
        "absents": absents
    }

# 5. Notifications
@router.get("/notifications", response_model=list[NotificationResponse])
async def get_notifications(
    limit: int = Query(10),
    current_user: User = Depends(require_role([UserRole.ENSEIGNANT])),
    db: Session = Depends(get_db)
):
    notifications = db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).order_by(Notification.date.desc()).limit(limit).all()
    
    return notifications

# 6. Liste des séances pour un enseignant
@router.get("/seances")
async def get_teacher_seances(
    current_user: User = Depends(require_role([UserRole.ENSEIGNANT])),
    db: Session = Depends(get_db)
):
    """Liste de toutes les séances d'un enseignant"""
    cours_list = db.query(Cours).filter(Cours.enseignant_id == current_user.id).all()
    cours_ids = [c.id for c in cours_list]
    
    seances = db.query(Seance).filter(Seance.cours_id.in_(cours_ids)).order_by(Seance.date.desc(), Seance.heure_debut.desc()).all()
    
    result = []
    for seance in seances:
        cours = db.query(Cours).filter(Cours.id == seance.cours_id).first()
        if not cours:
            continue
        
        module = db.query(Module).filter(Module.id == cours.module_id).first()
        groupe = db.query(Groupe).filter(Groupe.id == cours.groupe_id).first()
        
        # Compter les présences
        attendances = db.query(Attendance).filter(Attendance.seance_id == seance.id).all()
        presents = sum(1 for a in attendances if a.status.lower() == "present")
        retards = sum(1 for a in attendances if a.status.lower() == "late")
        
        # Total étudiants du groupe
        total_etudiants = 0
        if groupe:
            total_etudiants = db.query(Student).filter(Student.groupe_id == groupe.id).count()
        
        absents = max(0, total_etudiants - presents - retards)
        
        result.append({
            "id": seance.id,
            "date": seance.date.isoformat() if seance.date else None,
            "debut": seance.heure_debut.strftime('%H:%M') if seance.heure_debut else None,
            "fin": seance.heure_fin.strftime('%H:%M') if seance.heure_fin else None,
            "cours": module.nom if module else "N/A",
            "niveau": module.annee if module else 0,
            "groupe": groupe.code if groupe else "N/A",
            "salle": cours.salle or "",
            "totalEtudiants": total_etudiants,
            "presents": presents,
            "retards": retards,
            "absents": absents
        })
    
    return result

# 7. Liste des cours avec statistiques
@router.get("/cours")
async def get_teacher_cours(
    current_user: User = Depends(require_role([UserRole.ENSEIGNANT])),
    db: Session = Depends(get_db)
):
    """Liste des cours d'un enseignant avec statistiques"""
    # Récupérer tous les cours de l'enseignant (enseignant_id référence users.id)
    cours_list = db.query(Cours).filter(Cours.enseignant_id == current_user.id).all()
    
    result = []
    for cours in cours_list:
        module = db.query(Module).filter(Module.id == cours.module_id).first()
        groupe = db.query(Groupe).filter(Groupe.id == cours.groupe_id).first()
        
        if not module or not groupe:
            continue
        
        # Obtenir la filière
        from app.models.filiere import Filiere
        filiere = db.query(Filiere).filter(Filiere.id == module.filiere_id).first()
        filiere_code = filiere.code if filiere else "N/A"
        
        # Compter les étudiants du groupe
        nb_etudiants = db.query(Student).filter(Student.groupe_id == groupe.id).count()
        
        # Compter les séances pour ce cours
        seances = db.query(Seance).filter(Seance.cours_id == cours.id).all()
        nb_seances = len(seances)
        
        # Calculer le taux de présence
        total_presents = 0
        total_possible = 0
        
        for seance in seances:
            attendances = db.query(Attendance).filter(Attendance.seance_id == seance.id).all()
            presents = sum(1 for a in attendances if a.status.lower() == "present")
            total_presents += presents
            total_possible += nb_etudiants  # Chaque séance devrait avoir nb_etudiants présents max
        
        taux_presence = round((total_presents / total_possible * 100) if total_possible > 0 else 0, 1)
        
        # Groupes (pour l'instant un seul groupe par cours, mais on peut l'étendre)
        groupes_list = [groupe.code]
        
        result.append({
            "id": cours.id,
            "nom": module.nom,
            "code": module.code,
            "filiere": filiere_code,
            "niveau": module.annee,
            "groupes": groupes_list,
            "nbEtudiants": nb_etudiants,
            "nbSeances": nb_seances,
            "tauxPresence": taux_presence,
            "description": f"{module.nom} - {groupe.code}"
        })
    
    return result