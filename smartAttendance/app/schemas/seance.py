from pydantic import BaseModel
from datetime import datetime, time
from typing import Optional

class SeanceResponse(BaseModel):
    id: int
    cours_id: int
    date: datetime
    heure_debut: Optional[time]  # ← NOUVEAU
    heure_fin: Optional[time]    # ← NOUVEAU
    is_active: bool
    
    class Config:
        from_attributes = True