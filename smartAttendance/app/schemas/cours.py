from pydantic import BaseModel
from datetime import time
from typing import Optional
from app.models.cours import JourSemaine

class CoursCreate(BaseModel):
    module_id: int
    groupe_id: int
    enseignant_id: int
    jour: JourSemaine
    heure_debut: time
    heure_fin: time
    salle: Optional[str] = None

class CoursResponse(BaseModel):
    id: int
    module_id: int
    groupe_id: int
    enseignant_id: int
    jour: JourSemaine
    heure_debut: time
    heure_fin: time
    salle: Optional[str]
    
    class Config:
        from_attributes = True

class CoursWithDetails(BaseModel):
    id: int
    module: dict  # {id, code, nom}
    groupe: dict  # {id, code}
    enseignant: dict  # {id, full_name}
    jour: str
    heure_debut: time
    heure_fin: time
    salle: Optional[str]
    
    class Config:
        from_attributes = True