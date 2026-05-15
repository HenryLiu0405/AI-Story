"""Promotion / 内容传播助手 API — generate platform-specific social media copy."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.models import Chapter, KnowledgeBase, Memory, Project, StoryBibleEntry
from app.schemas.schemas import PromotionGenerateRequest, PromotionGenerateResponse
from app.services.promotion_service import promotion_service
from app.services.rag_service import rag_service

router = APIRouter(tags=["promotion"])


@router.post(
    "/api/projects/{project_id}/promotion/generate",
    response_model=PromotionGenerateResponse,
)
def generate_promotion(
    project_id: str,
    body: PromotionGenerateRequest,
    db: Session = Depends(get_db),
):
    """Generate platform-specific social media / promotion copy from project assets.

    Aggregates memories, story bible entries, chapters, and optionally knowledge
    base content, then uses AI to produce copy tailored to the target platform,
    content type, tone, and target reader segment.
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    memories = db.query(Memory).filter(Memory.project_id == project_id).all()
    story_bible_entries = (
        db.query(StoryBibleEntry)
        .filter(StoryBibleEntry.project_id == project_id)
        .all()
    )
    chapters = (
        db.query(Chapter)
        .filter(Chapter.project_id == project_id)
        .order_by(Chapter.order_index.asc())
        .all()
    )

    # Retrieve knowledge base contexts via RAG
    kb_contexts = []
    kbs = db.query(KnowledgeBase).filter(KnowledgeBase.project_id == project_id).all()
    if kbs:
        search_query = f"{project.name} {project.description or ''}"
        for kb in kbs:
            try:
                results = rag_service.search(search_query, kb.id, n_results=3)
                for r in results:
                    kb_contexts.append({
                        "source": f"KB: {kb.name}",
                        "content": r.get("content", ""),
                    })
            except Exception:
                pass

    promo_data = promotion_service.generate_promotion(
        project=project,
        platform=body.platform.value,
        content_type=body.content_type.value,
        tone=body.tone,
        target_reader=body.target_reader,
        memories=memories,
        story_bible_entries=story_bible_entries,
        chapters=chapters,
        kb_contexts=kb_contexts if kb_contexts else None,
    )

    return PromotionGenerateResponse(**promo_data)
