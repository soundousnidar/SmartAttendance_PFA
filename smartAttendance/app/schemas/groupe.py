from pydantic import BaseModel

class GroupeCreate(BaseModel):
    code: str
    filiere_id: int
    annee: int

class GroupeResponse(BaseModel):
    id: int
    code: str
    filiere_id: int
    annee: int
    
    class Config:
        from_attributes = True