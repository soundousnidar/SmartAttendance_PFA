from sqlalchemy import Column, Integer, ForeignKey, DateTime, Boolean, Time
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class Seance(Base):
    __tablename__ = "seances"
    
    id = Column(Integer, primary_key=True, index=True)
    cours_id = Column(Integer, ForeignKey("cours.id"))
    date = Column(DateTime(timezone=True), server_default=func.now())
    heure_debut = Column(Time, nullable=True)  # Copié du cours
    heure_fin = Column(Time, nullable=True)    # Copié du cours
    is_active = Column(Boolean, default=True)
    
    # Relations
    cours = relationship("Cours", back_populates="seances")
    attendances = relationship("Attendance", back_populates="seance")