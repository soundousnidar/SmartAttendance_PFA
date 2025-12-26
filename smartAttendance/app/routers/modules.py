from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.module import Module
from app.models.user import User, UserRole
from app.schemas.module import ModuleCreate, ModuleResponse
from app.utils.dependencies import require_role

router = APIRouter(prefix="/modules", tags=["Modules"])

@router.post("/", response_model=ModuleResponse)
def create_module(
    module: ModuleCreate,
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.SUPER_ADMIN])),
    db: Session = Depends(get_db)
):
    existing = db.query(Module).filter(Module.code == module.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Un module avec ce code existe déjà")
    
    new_module = Module(**module.dict())
    db.add(new_module)
    db.commit()
    db.refresh(new_module)
    return new_module

@router.get("/", response_model=list[ModuleResponse])
def get_all_modules(db: Session = Depends(get_db)):
    return db.query(Module).order_by(Module.code).all()

@router.get("/{module_id}", response_model=ModuleResponse)
def get_module(module_id: int, db: Session = Depends(get_db)):
    module = db.query(Module).filter(Module.id == module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    return module

@router.put("/{module_id}", response_model=ModuleResponse)
def update_module(
    module_id: int,
    module: ModuleCreate,
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.SUPER_ADMIN])),
    db: Session = Depends(get_db)
):
    db_module = db.query(Module).filter(Module.id == module_id).first()
    if not db_module:
        raise HTTPException(status_code=404, detail="Module not found")
    
    # Vérifier si le nouveau code existe déjà (sauf pour le module actuel)
    existing = db.query(Module).filter(
        Module.code == module.code,
        Module.id != module_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Un module avec ce code existe déjà")
    
    db_module.code = module.code
    db_module.nom = module.nom
    
    db.commit()
    db.refresh(db_module)
    return db_module

@router.delete("/{module_id}")
def delete_module(
    module_id: int,
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.SUPER_ADMIN])),
    db: Session = Depends(get_db)
):
    db_module = db.query(Module).filter(Module.id == module_id).first()
    if not db_module:
        raise HTTPException(status_code=404, detail="Module not found")
    
    # Vérifier s'il y a des cours associés
    if db_module.cours:
        raise HTTPException(
            status_code=400, 
            detail="Impossible de supprimer ce module car il est utilisé dans des cours"
        )
    
    db.delete(db_module)
    db.commit()
    return {"message": "Module supprimé avec succès"}