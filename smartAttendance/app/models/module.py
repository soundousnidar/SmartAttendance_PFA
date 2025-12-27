from sqlalchemy import Column, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from app.database import Base

class Module(Base):
    __tablename__ = "modules"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, nullable=False)
    nom = Column(String, nullable=False)
    filiere_id = Column(Integer, ForeignKey("filieres.id"), nullable=False)  # ← NOUVEAU
    annee = Column(Integer, nullable=False)  # ← NOUVEAU (1-5)
    
    # Relations
    filiere = relationship("Filiere", back_populates="modules")
    cours = relationship("Cours", back_populates="module")