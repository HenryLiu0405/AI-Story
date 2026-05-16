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
    locked: Optional[bool] = False
    confidence: Optional[float] = 1.0

class StoryBibleEntryUpdate(BaseModel):
    category: Optional[StoryBibleCategoryEnum] = None
    title: Optional[str] = None
    content: Optional[str] = None
    locked: Optional[bool] = None
    confidence: Optional[float] = None

class StoryBibleEntryResponse(StoryBibleEntryBase):
    id: str
    project_id: str
    source_type: str
    source_id: Optional[str] = None
    locked: bool
    confidence: float
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
    include_knowledge_base: bool = False
    scope: Optional[List[str]] = None  # e.g. ["character", "timeline", "world_rule"]

class ConsistencyIssue(BaseModel):
    severity: str  # low / medium / high
    type: str      # character / timeline / world_rule / plot / style / general
    issue: str
    evidence: str
    suggestion: str

class ConsistencyCheckResponse(BaseModel):
    issues: List[ConsistencyIssue]


# Chapter Schemas
class ChapterStatusEnum(str, Enum):
    OUTLINE = "outline"
    DRAFT = "draft"
    REVISING = "revising"
    DONE = "done"


class ChapterBase(BaseModel):
    title: str
    summary: Optional[str] = ""
    content: Optional[str] = ""
    status: ChapterStatusEnum = ChapterStatusEnum.OUTLINE
    order_index: Optional[float] = 0


class ChapterCreate(ChapterBase):
    pass


class ChapterUpdate(BaseModel):
    title: Optional[str] = None
    summary: Optional[str] = None
    content: Optional[str] = None
    status: Optional[ChapterStatusEnum] = None
    order_index: Optional[float] = None


class ChapterResponse(ChapterBase):
    id: str
    project_id: str
    word_count: float
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ChapterListResponse(BaseModel):
    chapters: List[ChapterResponse]
    total: int


# Character Interview Schemas
class CharacterInterviewRequest(BaseModel):
    question: str
    conversation_history: Optional[List[dict]] = None


class CharacterInterviewResponse(BaseModel):
    answer: str
    voice_notes: str
    possible_new_memory: Optional[dict] = None  # {"title": "...", "content": "..."}


# Pitch / 企划案 Schemas
class PitchCharacterInfo(BaseModel):
    name: str = ""
    role: str = ""
    description: str = ""


class PitchGenerateResponse(BaseModel):
    project_id: str
    logline: str = ""
    synopsis: str = ""
    selling_points: List[str] = []
    main_characters: List[PitchCharacterInfo] = []
    world_summary: str = ""
    cover_prompt: str = ""
    target_audience: str = ""
    social_posts: List[str] = []
    generated_at: Optional[datetime] = None


# Project Template Schemas
class TemplateGenreEnum(str, Enum):
    XUANHUAN = "xuanhuan"
    MYSTERY = "mystery"
    URBAN = "urban"
    ROMANCE = "romance"
    SCIFI = "scifi"


class TemplateMemoryItem(BaseModel):
    type: str  # character / world / plot / custom
    title: str
    content: str


class TemplateBibleItem(BaseModel):
    category: str  # character / world_rule / location / faction / ...
    title: str
    content: str


class TemplateData(BaseModel):
    project_description: str = ""
    memories: List[TemplateMemoryItem] = []
    story_bible_entries: List[TemplateBibleItem] = []


class TemplateCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    genre: TemplateGenreEnum
    template_data: TemplateData
    is_public: bool = True


class TemplateResponse(BaseModel):
    id: str
    name: str
    description: str
    genre: TemplateGenreEnum
    template_data: TemplateData
    is_public: bool
    created_at: datetime

    class Config:
        from_attributes = True


class CreateProjectFromTemplateRequest(BaseModel):
    name_override: Optional[str] = None


class ExportTemplateRequest(BaseModel):
    name: str
    description: Optional[str] = ""
    genre: TemplateGenreEnum
    is_public: bool = False


# =============================================================================
# Author Style DNA / 文风锁定 Schemas
# =============================================================================

class SentenceLengthEnum(str, Enum):
    SHORT = "short"      # 短句为主 (5-15字)
    MEDIUM = "medium"     # 中长句 (15-35字)
    LONG = "long"         # 长句为主 (35字以上)
    MIXED = "mixed"       # 长短结合


class NarrativePOVEnum(str, Enum):
    FIRST_PERSON = "first_person"
    THIRD_PERSON_LIMITED = "third_person_limited"
    THIRD_PERSON_OMNISCIENT = "third_person_omniscient"
    SECOND_PERSON = "second_person"
    MIXED = "mixed"


class DensityLevelEnum(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class PacingEnum(str, Enum):
    FAST = "fast"
    MEDIUM = "medium"
    SLOW = "slow"


class StyleRuleItem(BaseModel):
    """单条文风改写规则。"""
    dimension: str = ""            # 维度名称，如 "句长控制"
    description: str = ""          # 规则描述
    example: str = ""              # 示例（改写前后对比）


class StyleRulesJSON(BaseModel):
    """结构化文风分析结果，存储在 rules_json 字段中。"""
    avg_sentence_length: str = ""             # "中长句为主，15-35字"
    narrative_pov: str = ""                   # "第一人称" / "第三人称有限视角"
    dialogue_ratio: str = ""                   # "对话占比约30%" / "中等"
    emotion_density: str = ""                  # "高" / "中等" / "低"
    rhetorical_devices: List[str] = []         # e.g. ["比喻", "排比", "反问"]
    pacing: str = ""                            # "快节奏" / "中等" / "慢节奏"
    forbidden_styles: List[str] = []           # e.g. ["避免过度华丽的形容词堆砌"]
    sample_rules: List[StyleRuleItem] = []     # 示例改写规则


class AuthorStyleProfileCreate(BaseModel):
    """创建风格档案请求 — 只需名称和样本。"""
    name: str
    sample_text: str


class AuthorStyleProfileResponse(BaseModel):
    """风格档案完整响应。"""
    id: str
    project_id: str
    name: str
    sample_text: str
    style_summary: str
    rules_json: StyleRulesJSON
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class StyleRewriteRequest(BaseModel):
    """按风格改写请求。"""
    text: str


class StyleRewriteResponse(BaseModel):
    """改写响应 — 原文、改写文本、改动摘要。"""
    original_text: str
    rewritten_text: str
    changes_summary: str = ""


# =============================================================================
# Promotion / 内容传播助手 Schemas (Phase 7)
# =============================================================================


class PromotionPlatformEnum(str, Enum):
    XIAOHONGSHU = "xiaohongshu"
    WEIBO = "weibo"
    DOUYIN = "douyin"
    BILIBILI = "bilibili"
    TWITTER = "twitter"


class PromotionContentTypeEnum(str, Enum):
    CHARACTER_CARD = "character_card"
    CHAPTER_TEASER = "chapter_teaser"
    WORLD_INTRO = "world_intro"
    SHORT_VIDEO_SCRIPT = "short_video_script"
    INTERACTIVE_QUESTION = "interactive_question"
    SUBMISSION_INTRO = "submission_intro"


class PromotionGenerateRequest(BaseModel):
    platform: PromotionPlatformEnum = PromotionPlatformEnum.XIAOHONGSHU
    content_type: PromotionContentTypeEnum = PromotionContentTypeEnum.CHARACTER_CARD
    tone: str = "轻松活泼"
    target_reader: str = "网文读者"


class PromotionGenerateResponse(BaseModel):
    project_id: str
    platform: str
    content_type: str
    tone: str
    target_reader: str
    title: str = ""
    content: str = ""
    hashtags: List[str] = []
    platform_tips: str = ""
    generated_at: Optional[datetime] = None
