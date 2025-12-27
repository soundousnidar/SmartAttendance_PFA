from pydantic import BaseModel
from typing import Optional

class ModuleCreate(BaseModel):
    code: str
    nom: str
    filiere_id: int      # ← AJOUTER
    annee: int           # ← AJOUTER (1-5)

class ModuleResponse(BaseModel):
    id: int
    code: str
    nom: str
    filiere_id: int      # ← AJOUTER
    annee: int           # ← AJOUTER
    
    class Config:
        from_attributes = True

class ModuleWithFiliere(BaseModel):
    id: int
    code: str
    nom: str
    filiere_id: int
    annee: int
    filiere: dict  # {id, code, nom}  ← POUR L'AFFICHAGE
    
    class Config:
        from_attributes = True