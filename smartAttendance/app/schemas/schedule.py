from pydantic import BaseModel
from typing import Optional

class ScheduleItem(BaseModel):
    jour: str
    plage: str
    module: str
    professeur: str
    salle: str
    filiere: Optional[str] = None
    niveau: Optional[int] = None
    groupe: Optional[str] = None

class ScheduleResponse(BaseModel):
    schedule: list[ScheduleItem]