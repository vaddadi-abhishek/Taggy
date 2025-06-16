from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base
from .bookmark import bookmark_tags

class Tag(Base):
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True)
    tag_name = Column(String, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    bookmarks = relationship("Bookmark", secondary=bookmark_tags, back_populates="tags")
    user = relationship("User", back_populates="tags")
