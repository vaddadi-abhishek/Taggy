from sqlalchemy import Column, Integer, String, Text, ForeignKey, Table
from sqlalchemy.orm import relationship
from app.database import Base

bookmark_tags = Table(
    "bookmark_tags", Base.metadata,
    Column("bookmark_id", ForeignKey("bookmarks.id"), primary_key=True),
    Column("tag_id", ForeignKey("tags.id"), primary_key=True)
)

class Bookmark(Base):
    __tablename__ = "bookmarks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text)
    media_url = Column(String)  # optional media
    platform = Column(String, nullable=False)

    user = relationship("User", back_populates="bookmarks")
    tags = relationship("Tag", secondary=bookmark_tags, back_populates="bookmarks")
    ai_summary = relationship("AISummary", uselist=False, back_populates="bookmark", cascade="all, delete-orphan")
    ai_tags = relationship("AITag", back_populates="bookmark", cascade="all, delete-orphan")
