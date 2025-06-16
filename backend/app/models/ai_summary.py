from sqlalchemy import Column, Integer, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class AISummary(Base):
    __tablename__ = "ai_summaries"

    id = Column(Integer, primary_key=True)
    bookmark_id = Column(Integer, ForeignKey("bookmarks.id"), unique=True)
    summary = Column(Text)

    bookmark = relationship("Bookmark", back_populates="ai_summary")
