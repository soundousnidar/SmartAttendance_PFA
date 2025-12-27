from pydantic import BaseModel
from typing import Optional

class EnseignantResponse(BaseModel):
    id: int
    user_id: int
    full_name: str
    email: str
    is_active: bool
    photo_path: Optional[str]
    
    class Config:
        from_attributes = True