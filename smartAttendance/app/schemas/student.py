from pydantic import BaseModel
from typing import Optional

class StudentResponse(BaseModel):
    id: int
    user_id: int
    full_name: str  # Vient de user
    email: str      # Vient de user
    is_active: bool # Vient de user
    groupe_id: Optional[int]
    photo_path: Optional[str]
    
    class Config:
        from_attributes = True

class StudentActivateRequest(BaseModel):
    groupe_id: int