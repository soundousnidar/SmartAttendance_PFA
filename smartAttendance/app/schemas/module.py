from pydantic import BaseModel

class ModuleCreate(BaseModel):
    code: str
    nom: str

class ModuleResponse(BaseModel):
    id: int
    code: str
    nom: str
    
    class Config:
        from_attributes = True