from sqlalchemy import Integer, String, ForeignKey, LargeBinary
from sqlalchemy.orm import relationship, Mapped, mapped_column
from app.database import Base
from typing import Optional


class Enseignant(Base):
    __tablename__ = "enseignants"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    photo_path: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    embedding: Mapped[Optional[bytes]] = mapped_column(LargeBinary, nullable=True)
    
    # Relations
    user: Mapped["User"] = relationship("User")