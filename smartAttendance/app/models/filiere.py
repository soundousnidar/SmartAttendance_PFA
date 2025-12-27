from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.database import Base

class Filiere(Base):
    __tablename__ = "filieres"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, nullable=False)
    nom = Column(String, nullable=False)
    
    # Relations
    groupes = relationship("Groupe", back_populates="filiere")
    modules = relationship("Module", back_populates="filiere")  # ← AJOUTER