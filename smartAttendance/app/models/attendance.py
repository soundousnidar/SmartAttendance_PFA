from sqlalchemy import Column, Integer, ForeignKey, Float, DateTime, String
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base
import enum

# ✅ GARDER l'enum pour les autres fichiers qui l'importent
class AttendanceStatus(str, enum.Enum):
    PRESENT = "present"
    LATE = "late"
    ABSENT = "absent"

class Attendance(Base):
    __tablename__ = "attendances"
    
    id = Column(Integer, primary_key=True, index=True)
    seance_id = Column(Integer, ForeignKey("seances.id"))
    student_id = Column(Integer, ForeignKey("students.id"))
    confidence = Column(Float, nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    
    # ✅ UTILISER String au lieu de SQLEnum
    status = Column(String, nullable=False)
    
    # Relations
    seance = relationship("Seance", back_populates="attendances")
    student = relationship("Student", back_populates="attendances")