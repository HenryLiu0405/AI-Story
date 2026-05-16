"""Pitch / 企划案 API — generate structured submission package from project assets."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.models import Chapter, KnowledgeBase, Memory, Project, StoryBibleEntry
from app.schemas.schemas import PitchGenerateResponse
from app.services.pitch_service import pitch_service
from app.services.rag_service import rag_service

router = APIRouter(tags=["pitch"])


@router.post(
    "/api/projects/{project_id}/pitch/generate",
    response_model=PitchGenerateResponse,
)
def generate_pitch(project_id: str, db: Session = Depends(get_db)):
    """Generate a structured pitch / submission package from all project assets.

    Aggregates memories, story bible entries, chapters, and knowledge base
    content, then uses AI to produce a complete set of pitch materials
    including logline, synopsis, selling points, character profiles,
    world summary, cover art prompt, target audience analysis, and
    social media copy.
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
        # Use project name + description as the search query for relevant KB snippets
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
                # KB search failure should not block pitch generation
                pass

    pitch_data = pitch_service.generate_pitch(
        project=project,
        memories=memories,
        story_bible_entries=story_bible_entries,
        chapters=chapters,
        kb_contexts=kb_contexts if kb_contexts else None,
    )

    return PitchGenerateResponse(**pitch_data)
