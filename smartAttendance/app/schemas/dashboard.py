from pydantic import BaseModel
from typing import List

class TeacherStats(BaseModel):
    total_cours_semaine: int
    cours_aujourdhui: int
    total_etudiants: int
    taux_presence_moyen: float

class CoursAujourdhui(BaseModel):
    id: int
    heure: str
    cours: str  # Changed from module to match frontend
    niveau: int
    groupe: str
    salle: str
    presents: int
    absents: int
    retards: int
    total: int

class TauxParCours(BaseModel):
    cours: str
    taux: float

class EtudiantRisque(BaseModel):
    nom: str
    cours: str
    niveau: str
    absences: int
    taux_presence: float

class TeacherDashboardResponse(BaseModel):
    stats: TeacherStats
    cours_aujourdhui: List[CoursAujourdhui]
    evolution_presence: List[float]
    taux_presence_par_cours: List[TauxParCours]
    etudiants_a_risque: List[EtudiantRisque]