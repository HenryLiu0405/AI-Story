from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

class MemoryTypeEnum(str, Enum):
    CHARACTER = "character"
    WORLD = "world"
    PLOT = "plot"
    CUSTOM = "custom"

class MessageRoleEnum(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"

# Project Schemas
class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = ""

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class ProjectResponse(ProjectBase):
    id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Session Schemas
class SessionBase(BaseModel):
    name: Optional[str] = "新会话"

class SessionCreate(SessionBase):
    project_id: Optional[str] = None

class SessionUpdate(BaseModel):
    name: Optional[str] = None

class SessionResponse(SessionBase):
    id: str
    project_id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Message Schemas
class MessageBase(BaseModel):
    role: MessageRoleEnum
    content: str

class MessageCreate(MessageBase):
    pass

class MessageResponse(MessageBase):
    id: str
    session_id: str
    created_at: datetime
    
    class Config:
        from_attributes = True

# Memory Schemas
class MemoryBase(BaseModel):
    type: MemoryTypeEnum
    title: str
    content: str

class MemoryCreate(MemoryBase):
    project_id: str

class MemoryUpdate(BaseModel):
    type: Optional[MemoryTypeEnum] = None
    title: Optional[str] = None
    content: Optional[str] = None

class MemoryResponse(MemoryBase):
    id: str
    project_id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# KnowledgeBase Schemas
class KnowledgeBaseBase(BaseModel):
    name: str
    description: Optional[str] = ""

class KnowledgeBaseCreate(KnowledgeBaseBase):
    project_id: str

class KnowledgeBaseResponse(KnowledgeBaseBase):
    id: str
    project_id: str
    created_at: datetime
    
    class Config:
        from_attributes = True

# Document Schemas
class DocumentResponse(BaseModel):
    id: str
    knowledge_base_id: str
    filename: str
    metadata: dict = Field(default_factory=dict, validation_alias="doc_metadata", serialization_alias="metadata")
    created_at: datetime
    
    class Config:
        from_attributes = True

# Chat Schemas
class ChatRequest(BaseModel):
    session_id: str
    message: str
    project_id: str

class ChatResponse(BaseModel):
    message: MessageResponse
    context_used: List[str] = []

# Search Schemas
class SearchRequest(BaseModel):
    query: str
    knowledge_base_id: Optional[str] = None
    project_id: Optional[str] = None
    top_k: int = 5

class SearchResult(BaseModel):
    content: str
    metadata: dict
    score: float

# Story Bible Schemas
class StoryBibleCategoryEnum(str, Enum):
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

class StoryBibleEntryBase(BaseModel):
    category: StoryBibleCategoryEnum = StoryBibleCategoryEnum.NOTE
    title: str
    content: str

class StoryBibleEntryCreate(StoryBibleEntryBase):
    source_type: Optional[str] = "manual"
    source_id: Optional[str] = None

class StoryBibleEntryUpdate(BaseModel):
    category: Optional[StoryBibleCategoryEnum] = None
    title: Optional[str] = None
    content: Optional[str] = None

class StoryBibleEntryResponse(StoryBibleEntryBase):
    id: str
    project_id: str
    source_type: str
    source_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class StoryBibleGenerateResponse(BaseModel):
    entries: List[StoryBibleEntryResponse]
    created_count: int

# Consistency Check Schemas
class ConsistencyCheckRequest(BaseModel):
    text: str
    include_memories: bool = True
    include_story_bible: bool = True

class ConsistencyIssue(BaseModel):
    severity: str
    type: str
    issue: str
    evidence: str
    suggestion: str

class ConsistencyCheckResponse(BaseModel):
    issues: List[ConsistencyIssue]
