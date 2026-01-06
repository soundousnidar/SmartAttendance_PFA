from pydantic import BaseModel
from datetime import date, time
from typing import Optional

class SeanceBase(BaseModel):
    date: date
    debut: time
    fin: time
    module: str
    salle: str
    filiere: Optional[str] = None
    niveau: Optional[int] = None
    groupe: Optional[str] = None
    total_etudiants: int = 0

class SeanceResponse(SeanceBase):
    id: int
    cours_id: Optional[int] = None

    class Config:
        from_attributes = True

class CurrentSeanceResponse(BaseModel):
    seance: Optional[SeanceResponse] = None
    presents: int = 0
    retards: int = 0
    absents: int = 0
    temps_ecoule: Optional[str] = None  # Optionnel, calculé côté front

    class Config:
        from_attributes = True