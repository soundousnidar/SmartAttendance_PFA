from sqlalchemy import Integer, String, ForeignKey, LargeBinary
from sqlalchemy.orm import relationship, Mapped, mapped_column
from app.database import Base
from typing import Optional, List

class Student(Base):
    __tablename__ = "students"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), unique=True, nullable=False)  # ← LIEN AVEC USER
    groupe_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("groupes.id"), nullable=True)  # ← Nullable (admin complète)
    photo_path: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    embedding: Mapped[Optional[bytes]] = mapped_column(LargeBinary, nullable=True)
    
    # Relations
    user: Mapped["User"] = relationship("User")
    groupe: Mapped[Optional["Groupe"]] = relationship("Groupe", back_populates="students")
    attendances: Mapped[List["Attendance"]] = relationship("Attendance", back_populates="student")
    embeddings: Mapped[List["StudentEmbedding"]] = relationship("StudentEmbedding", back_populates="student")