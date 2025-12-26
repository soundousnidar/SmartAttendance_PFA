from pydantic import BaseModel

class FiliereCreate(BaseModel):
    code: str
    nom: str

class FiliereResponse(BaseModel):
    id: int
    code: str
    nom: str
    
    class Config:
        from_attributes = True