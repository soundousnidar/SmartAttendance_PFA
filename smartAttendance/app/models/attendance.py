from sqlalchemy import Column, Integer, ForeignKey, Float, DateTime, Enum as SQLEnum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base
import enum

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
    status = Column(SQLEnum(AttendanceStatus), default=AttendanceStatus.PRESENT)
    
    # Relations
    seance = relationship("Seance", back_populates="attendances")
    student = relationship("Student", back_populates="attendances")