from sqlalchemy import Column, Integer, String, ForeignKey, LargeBinary
from sqlalchemy.orm import relationship
from app.database import Base

class Enseignant(Base):
    __tablename__ = "enseignants"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    photo_path = Column(String, nullable=True)
    embedding = Column(LargeBinary, nullable=True)
    
    # Relations
    user = relationship("User")