from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.models.models import Chapter, Project, ChapterStatus
from app.schemas.schemas import (
    ChapterCreate,
    ChapterUpdate,
    ChapterResponse,
    ChapterListResponse,
)

router = APIRouter(tags=["chapters"])


def _get_project(project_id: str, db: Session) -> Project:
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


def _get_chapter(chapter_id: str, db: Session) -> Chapter:
    chapter = db.query(Chapter).filter(Chapter.id == chapter_id).first()
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")
    return chapter


def _calc_word_count(content: str) -> float:
    """Rough Chinese + English word count. Chinese chars count as 1 each."""
    if not content:
        return 0
    # Count CJK characters
    cjk = sum(1 for c in content if '\u4e00' <= c <= '\u9fff' or '\u3400' <= c <= '\u4dbf')
    # Count English words
    non_cjk = content
    for c in content:
        if '\u4e00' <= c <= '\u9fff' or '\u3400' <= c <= '\u4dbf':
            non_cjk = non_cjk.replace(c, ' ')
    english_words = len(non_cjk.split())
    return cjk + english_words


@router.get("/api/projects/{project_id}/chapters", response_model=ChapterListResponse)
def list_chapters(
    project_id: str,
    status: Optional[str] = Query(None, description="Filter by status"),
    db: Session = Depends(get_db),
):
    """List all chapters for a project, ordered by order_index."""
    _get_project(project_id, db)

    query = db.query(Chapter).filter(Chapter.project_id == project_id)
    if status:
        query = query.filter(Chapter.status == status)
    chapters = query.order_by(Chapter.order_index.asc(), Chapter.created_at.asc()).all()

    return ChapterListResponse(
        chapters=[ChapterResponse.model_validate(c) for c in chapters],
        total=len(chapters),
    )


@router.post("/api/projects/{project_id}/chapters", response_model=ChapterResponse, status_code=201)
def create_chapter(project_id: str, data: ChapterCreate, db: Session = Depends(get_db)):
    """Create a new chapter."""
    _get_project(project_id, db)

    # Auto-increment order_index if not provided
    order_index = data.order_index
    if order_index == 0 or order_index is None:
        last = (
            db.query(Chapter)
            .filter(Chapter.project_id == project_id)
            .order_by(Chapter.order_index.desc())
            .first()
        )
        order_index = (last.order_index + 1) if last else 1

    word_count = _calc_word_count(data.content or "")

    chapter = Chapter(
        project_id=project_id,
        title=data.title,
        summary=data.summary or "",
        content=data.content or "",
        status=ChapterStatus(data.status.value if hasattr(data.status, 'value') else data.status),
        order_index=order_index,
        word_count=word_count,
    )
    db.add(chapter)
    db.commit()
    db.refresh(chapter)
    return ChapterResponse.model_validate(chapter)


@router.get("/api/chapters/{chapter_id}", response_model=ChapterResponse)
def get_chapter(chapter_id: str, db: Session = Depends(get_db)):
    """Get a single chapter by ID."""
    chapter = _get_chapter(chapter_id, db)
    return ChapterResponse.model_validate(chapter)


@router.put("/api/chapters/{chapter_id}", response_model=ChapterResponse)
def update_chapter(chapter_id: str, data: ChapterUpdate, db: Session = Depends(get_db)):
    """Update a chapter."""
    chapter = _get_chapter(chapter_id, db)

    update_data = data.model_dump(exclude_unset=True)

    # Map ChapterStatusEnum to ChapterStatus if present
    if "status" in update_data and update_data["status"] is not None:
        update_data["status"] = ChapterStatus(update_data["status"].value if hasattr(update_data["status"], 'value') else update_data["status"])

    # Recalculate word_count if content changed
    if "content" in update_data:
        update_data["word_count"] = _calc_word_count(update_data["content"])

    for key, value in update_data.items():
        setattr(chapter, key, value)

    db.commit()
    db.refresh(chapter)
    return ChapterResponse.model_validate(chapter)


@router.delete("/api/chapters/{chapter_id}", status_code=204)
def delete_chapter(chapter_id: str, db: Session = Depends(get_db)):
    """Delete a chapter."""
    chapter = _get_chapter(chapter_id, db)
    db.delete(chapter)
    db.commit()
    return None
