# API module
from app.api.projects import router as projects_router
from app.api.sessions import router as sessions_router
from app.api.memories import router as memories_router
from app.api.knowledge_bases import router as knowledge_bases_router
from app.api.messages import router as messages_router
from app.api.chat import router as chat_router
from app.api.story_bible import router as story_bible_router
from app.api.consistency import router as consistency_router
from app.api.settings import router as settings_router
from app.api.chapters import router as chapters_router
from app.api.character_chat import router as character_chat_router
from app.api.pitch import router as pitch_router
from app.api.templates import router as templates_router
from app.api.style import router as style_router
from app.api.promotion import router as promotion_router

__all__ = [
    "projects_router",
    "sessions_router",
    "memories_router",
    "knowledge_bases_router",
    "messages_router",
    "chat_router",
    "story_bible_router",
    "consistency_router",
    "settings_router",
    "chapters_router",
    "character_chat_router",
    "pitch_router",
    "templates_router",
    "style_router",
    "promotion_router",
]
