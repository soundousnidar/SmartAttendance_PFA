from sqlalchemy import Column, Integer, String, ForeignKey, Time, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.database import Base
import enum

class JourSemaine(str, enum.Enum):
    LUNDI = "Lundi"
    MARDI = "Mardi"
    MERCREDI = "Mercredi"
    JEUDI = "Jeudi"
    VENDREDI = "Vendredi"
    SAMEDI = "Samedi"

class Cours(Base):
    __tablename__ = "cours"
    
    id = Column(Integer, primary_key=True, index=True)
    module_id = Column(Integer, ForeignKey("modules.id"), nullable=False)
    groupe_id = Column(Integer, ForeignKey("groupes.id"), nullable=False)
    enseignant_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    jour = Column(SQLEnum(JourSemaine), nullable=False)
    heure_debut = Column(Time, nullable=False)
    heure_fin = Column(Time, nullable=False)
    salle = Column(String, nullable=True)
    
    # Relations
    module = relationship("Module", back_populates="cours")
    groupe = relationship("Groupe", back_populates="cours")
    enseignant = relationship("User")
    seances = relationship("Seance", back_populates="cours")