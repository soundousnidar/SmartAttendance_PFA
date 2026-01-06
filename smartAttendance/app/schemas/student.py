from pydantic import BaseModel
from typing import Optional


class UserInStudent(BaseModel):
    id: int
    email: str
    full_name: str
    is_active: bool
    
    class Config:
        from_attributes = True


class StudentResponse(BaseModel):
    id: int
    user_id: int
    groupe_id: Optional[int]
    photo_path: Optional[str]
    user: UserInStudent  
    presence_percentage: float
    class Config:
        from_attributes = True

class StudentActivateRequest(BaseModel):
    groupe_id: int