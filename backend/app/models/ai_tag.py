from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class AITag(Base):
    __tablename__ = "ai_tags"

    id = Column(Integer, primary_key=True)
    bookmark_id = Column(Integer, ForeignKey("bookmarks.id"))
    ai_tag_name = Column(String)

    bookmark = relationship("Bookmark", back_populates="ai_tags")
