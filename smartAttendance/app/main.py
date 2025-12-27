from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles  # ← AJOUTER
from app.database import engine, Base
from app.routers import (
    auth, filieres, groupes, students, 
    modules, cours, seances, recognition, attendance, enseignants
)
from app.config import settings

# Importer TOUS les modèles
from app.models.user import User
from app.models.filiere import Filiere
from app.models.groupe import Groupe
from app.models.student import Student
from app.models.module import Module
from app.models.cours import Cours
from app.models.seance import Seance
from app.models.attendance import Attendance
from app.models.student_embedding import StudentEmbedding

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="API for Smart Attendance System with Facial Recognition",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ← AJOUTER CETTE LIGNE POUR SERVIR LES FICHIERS STATIQUES
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.on_event("startup")
def load_models():
    from app.services.embedding_extractor import extractor
    _ = extractor.mtcnn
    _ = extractor.facenet
    print("✅ MTCNN and FaceNet loaded")

app.include_router(auth.router)
app.include_router(filieres.router)
app.include_router(groupes.router)
app.include_router(students.router)
app.include_router(modules.router)
app.include_router(cours.router)
app.include_router(seances.router)
app.include_router(recognition.router)
app.include_router(attendance.router) 
app.include_router(enseignants.router)

@app.get("/")
def root():
    return {
        "message": "Smart Attendance System API v2.0",
        "docs": "/docs",
        "status": "operational"
    }