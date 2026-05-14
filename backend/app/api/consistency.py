from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.models import KnowledgeBase, Memory, Project, StoryBibleEntry
from app.schemas.schemas import ConsistencyCheckRequest, ConsistencyCheckResponse
from app.services.consistency_service import consistency_service
from app.services.rag_service import rag_service

router = APIRouter(tags=["consistency"])


@router.post("/api/projects/{project_id}/consistency-check", response_model=ConsistencyCheckResponse)
def check_consistency(project_id: str, request: ConsistencyCheckRequest, db: Session = Depends(get_db)):
    """Check draft text against memories, story bible entries, and optionally knowledge bases."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    memories = []
    if request.include_memories:
        memories = db.query(Memory).filter(Memory.project_id == project_id).all()

    story_bible_entries = []
    if request.include_story_bible:
        story_bible_entries = db.query(StoryBibleEntry).filter(
            StoryBibleEntry.project_id == project_id
        ).all()

    kb_contexts = None
    if request.include_knowledge_base:
        kbs = db.query(KnowledgeBase).filter(KnowledgeBase.project_id == project_id).all()
        kb_contexts = []
        for kb in kbs:
            results = rag_service.search(request.text, kb.id, n_results=3)
            for r in results:
                kb_contexts.append({
                    "source": f"KB: {kb.name}",
                    "content": r.get("content", ""),
                })

    issues = consistency_service.check(
        request.text,
        memories,
        story_bible_entries,
        kb_contexts=kb_contexts,
        scope=request.scope,
    )
    return ConsistencyCheckResponse(issues=issues)
