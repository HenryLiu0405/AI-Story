from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import engine, Base
from app.api import (
    projects_router,
    sessions_router,
    memories_router,
    knowledge_bases_router,
    messages_router,
    chat_router,
    story_bible_router,
    consistency_router
)

# Create database tables
Base.metadata.create_all(bind=engine)

# Create FastAPI app
app = FastAPI(
    title="AI Novel Companion API",
    description="AI小说构思助手的API接口",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(projects_router)
app.include_router(sessions_router)
app.include_router(memories_router)
app.include_router(knowledge_bases_router)
app.include_router(messages_router)
app.include_router(chat_router)
app.include_router(story_bible_router)
app.include_router(consistency_router)

@app.get("/")
def root():
    return {"message": "AI Novel Companion API", "version": "1.0.0"}

@app.get("/api/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    from app.core.config import settings
    
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=True
    )
