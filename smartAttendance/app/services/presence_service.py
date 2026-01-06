from sqlalchemy.orm import Session
from app.models.attendance import Attendance
from app.models.seance import Seance

def calculate_presence_percentage(student_id: int, db: Session) -> float:
    """
    Calcule le pourcentage de présence d'un étudiant
    """
    total_seances = db.query(Seance).join(Attendance).filter(Attendance.student_id == student_id).count()
    if total_seances == 0:
        return 0.0
    
    presents = db.query(Attendance).filter(
        Attendance.student_id == student_id,
        Attendance.statut == "present"
    ).count()
    
    return round((presents / total_seances) * 100, 1)