from sqlalchemy import Column, Integer, String, ForeignKey, LargeBinary
from sqlalchemy.orm import relationship
from app.database import Base

class Student(Base):
    __tablename__ = "students"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)  # ← LIEN AVEC USER
    groupe_id = Column(Integer, ForeignKey("groupes.id"), nullable=True)  # ← Nullable (admin complète)
    photo_path = Column(String, nullable=True)
    embedding = Column(LargeBinary, nullable=True)
    
    # Relations
    user = relationship("User")
    groupe = relationship("Groupe", back_populates="students")
    attendances = relationship("Attendance", back_populates="student")
    embeddings = relationship("StudentEmbedding", back_populates="student")