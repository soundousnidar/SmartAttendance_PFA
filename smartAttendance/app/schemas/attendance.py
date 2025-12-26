from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class AttendanceStatus(str):
    PRESENT = "present"
    LATE = "late"
    ABSENT = "absent"

class AttendanceResponse(BaseModel):
    id: int
    seance_id: int
    student_id: int
    confidence: float
    timestamp: datetime
    status: str
    
    class Config:
        from_attributes = True