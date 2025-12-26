from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from app.database import get_db
from app.models.user import User, UserRole
from pydantic import BaseModel
from app.schemas.user import UserCreate, UserResponse, Token, UserUpdate
from app.utils.security import (
    verify_password, 
    get_password_hash, 
    create_access_token,
    determine_role_from_email
)
from app.utils.dependencies import get_current_active_user, require_role
from app.config import settings

class LoginRequest(BaseModel):
    username: str  # Peut être email ou full_name
    password: str

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def signup(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Inscription d'un nouvel utilisateur.
    Le rôle est automatiquement déterminé selon l'email:
    - @emsi.ma -> enseignant
    - @emsi-edu.ma -> student
    """
    # Vérifier si l'email existe déjà
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Déterminer le rôle basé sur l'email
    role = determine_role_from_email(user_data.email)
    
    # Créer le nouvel utilisateur
    new_user = User(
        email=user_data.email,
        full_name=user_data.full_name,
        hashed_password=get_password_hash(user_data.password),
        role=role
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user

@router.post("/login", response_model=Token)
def login(
    login_data: LoginRequest,
    db: Session = Depends(get_db)
):
    """
    Connexion avec email/full_name et mot de passe.
    """
    # Chercher par email OU full_name
    user = db.query(User).filter(
        (User.email == login_data.username) | (User.full_name == login_data.username)
    ).first()
    
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email/name or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user account"
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_active_user)):
    """
    Récupérer les informations de l'utilisateur connecté.
    """
    return current_user

@router.get("/users", response_model=list[UserResponse])
def get_all_users(
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.SUPER_ADMIN])),
    db: Session = Depends(get_db)
):
    """
    Récupérer tous les utilisateurs (Admin et Super Admin uniquement).
    """
    users = db.query(User).all()
    return users

@router.put("/users/{user_id}/role", response_model=UserResponse)
def update_user_role(
    user_id: int,
    user_update: UserUpdate,
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.SUPER_ADMIN])),
    db: Session = Depends(get_db)
):
    """
    Modifier le rôle d'un utilisateur (Admin et Super Admin uniquement).
    Seul le Super Admin peut créer d'autres admins.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Seul le super admin peut modifier les rôles admin
    if user_update.role in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        if current_user.role != UserRole.SUPER_ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only Super Admin can assign Admin roles"
            )
    
    # Empêcher la modification du super admin
    if user.role == UserRole.SUPER_ADMIN and current_user.id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot modify Super Admin account"
        )
    
    # Mise à jour des champs
    if user_update.full_name is not None:
        user.full_name = user_update.full_name
    if user_update.role is not None:
        user.role = user_update.role
    if user_update.is_active is not None:
        user.is_active = user_update.is_active
    
    db.commit()
    db.refresh(user)
    
    return user

@router.post("/create-super-admin", response_model=UserResponse)
def create_super_admin(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Créer le premier Super Admin (à utiliser une seule fois).
    Cette route devrait être désactivée après la création du premier super admin.
    """
    # Vérifier s'il existe déjà un super admin
    existing_super_admin = db.query(User).filter(User.role == UserRole.SUPER_ADMIN).first()
    if existing_super_admin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Super Admin already exists"
        )
    
    # Créer le super admin
    super_admin = User(
        email=user_data.email,
        full_name=user_data.full_name,
        hashed_password=get_password_hash(user_data.password),
        role=UserRole.SUPER_ADMIN
    )
    
    db.add(super_admin)
    db.commit()
    db.refresh(super_admin)
    
    return super_admin