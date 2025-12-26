from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Groupe(Base):
    __tablename__ = "groupes"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, nullable=False)
    filiere_id = Column(Integer, ForeignKey("filieres.id"), nullable=False)
    annee = Column(Integer, nullable=False)
    
    # Relations
    filiere = relationship("Filiere", back_populates="groupes")
    students = relationship("Student", back_populates="groupe")
    cours = relationship("Cours", back_populates="groupe")