from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Enum as SQLEnum, JSON, Boolean, Float
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum

from app.core.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class MemoryType(str, enum.Enum):
    CHARACTER = "character"
    WORLD = "world"
    PLOT = "plot"
    CUSTOM = "custom"

class MessageRole(str, enum.Enum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"

class StoryBibleCategory(str, enum.Enum):
    CHARACTER = "character"
    WORLD_RULE = "world_rule"
    LOCATION = "location"
    FACTION = "faction"
    TIMELINE = "timeline"
    PLOT_THREAD = "plot_thread"
    FORESHADOWING = "foreshadowing"
    THEME = "theme"
    STYLE_RULE = "style_rule"
    NOTE = "note"

class Project(Base):
    __tablename__ = "projects"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    description = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    sessions = relationship("Session", back_populates="project", cascade="all, delete-orphan")
    memories = relationship("Memory", back_populates="project", cascade="all, delete-orphan")
    knowledge_bases = relationship("KnowledgeBase", back_populates="project", cascade="all, delete-orphan")
    story_bible_entries = relationship("StoryBibleEntry", back_populates="project", cascade="all, delete-orphan")
    style_profiles = relationship("AuthorStyleProfile", back_populates="project", cascade="all, delete-orphan")

class Session(Base):
    __tablename__ = "sessions"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id"), nullable=False)
    name = Column(String(255), default="新会话")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    project = relationship("Project", back_populates="sessions")
    messages = relationship("Message", back_populates="session", cascade="all, delete-orphan", order_by="Message.created_at")

class Message(Base):
    __tablename__ = "messages"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    session_id = Column(String(36), ForeignKey("sessions.id"), nullable=False)
    role = Column(SQLEnum(MessageRole), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    session = relationship("Session", back_populates="messages")

class Memory(Base):
    __tablename__ = "memories"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id"), nullable=False)
    type = Column(SQLEnum(MemoryType), default=MemoryType.CUSTOM)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    project = relationship("Project", back_populates="memories")

class StoryBibleEntry(Base):
    __tablename__ = "story_bible_entries"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id"), nullable=False)
    category = Column(SQLEnum(StoryBibleCategory), default=StoryBibleCategory.NOTE)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    source_type = Column(String(64), default="manual")
    source_id = Column(String(36), nullable=True)
    locked = Column(Boolean, default=False)
    confidence = Column(Float, default=1.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    project = relationship("Project", back_populates="story_bible_entries")

class KnowledgeBase(Base):
    __tablename__ = "knowledge_bases"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    project = relationship("Project", back_populates="knowledge_bases")
    documents = relationship("Document", back_populates="knowledge_base", cascade="all, delete-orphan")

class Document(Base):
    __tablename__ = "documents"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    knowledge_base_id = Column(String(36), ForeignKey("knowledge_bases.id"), nullable=False)
    filename = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    doc_metadata = Column(JSON, default={})
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    knowledge_base = relationship("KnowledgeBase", back_populates="documents")


class ChapterStatus(str, enum.Enum):
    OUTLINE = "outline"
    DRAFT = "draft"
    REVISING = "revising"
    DONE = "done"


class Chapter(Base):
    __tablename__ = "chapters"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id"), nullable=False)
    title = Column(String(255), nullable=False)
    summary = Column(Text, default="")
    content = Column(Text, default="")
    status = Column(SQLEnum(ChapterStatus), default=ChapterStatus.OUTLINE)
    order_index = Column(Float, default=0)
    word_count = Column(Float, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    project = relationship("Project")


class TemplateGenre(str, enum.Enum):
    XUANHUAN = "xuanhuan"
    MYSTERY = "mystery"
    URBAN = "urban"
    ROMANCE = "romance"
    SCIFI = "scifi"


class ProjectTemplate(Base):
    __tablename__ = "project_templates"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    description = Column(Text, default="")
    genre = Column(SQLEnum(TemplateGenre), nullable=False)
    template_data = Column(JSON, default={})
    is_public = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class AuthorStyleProfile(Base):
    __tablename__ = "author_style_profiles"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id"), nullable=False)
    name = Column(String(255), nullable=False)
    sample_text = Column(Text, nullable=False)
    style_summary = Column(Text, default="")
    rules_json = Column(JSON, default={})
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    project = relationship("Project", back_populates="style_profiles")
