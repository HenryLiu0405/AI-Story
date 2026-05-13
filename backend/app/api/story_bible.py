from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models.models import Memory, Message, Project, Session as SessionModel, StoryBibleEntry
from app.schemas.schemas import (
    StoryBibleEntryCreate,
    StoryBibleEntryResponse,
    StoryBibleEntryUpdate,
    StoryBibleGenerateResponse,
)
from app.services.story_bible_service import story_bible_service

router = APIRouter(tags=["story_bible"])


@router.get("/api/projects/{project_id}/story-bible", response_model=List[StoryBibleEntryResponse])
def get_story_bible(project_id: str, db: Session = Depends(get_db)):
    """Get all story bible entries for a project."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    return db.query(StoryBibleEntry).filter(
        StoryBibleEntry.project_id == project_id
    ).order_by(StoryBibleEntry.category.asc(), StoryBibleEntry.updated_at.desc()).all()


@router.post("/api/projects/{project_id}/story-bible", response_model=StoryBibleEntryResponse)
def create_story_bible_entry(project_id: str, entry: StoryBibleEntryCreate, db: Session = Depends(get_db)):
    """Create a story bible entry manually."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    db_entry = StoryBibleEntry(
        project_id=project_id,
        category=entry.category,
        title=entry.title,
        content=entry.content,
        source_type=entry.source_type or "manual",
        source_id=entry.source_id,
    )
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    return db_entry


@router.post("/api/projects/{project_id}/story-bible/generate", response_model=StoryBibleGenerateResponse)
def generate_story_bible(project_id: str, db: Session = Depends(get_db)):
    """Generate story bible entries from memories and recent conversation messages."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    memories = db.query(Memory).filter(Memory.project_id == project_id).all()
    messages = db.query(Message).join(SessionModel).filter(
        SessionModel.project_id == project_id
    ).order_by(Message.created_at.asc()).all()

    generated_entries = story_bible_service.build_entries_from_project(memories, messages)
    existing_keys = {
        (entry.source_type, entry.source_id, entry.title)
        for entry in db.query(StoryBibleEntry).filter(StoryBibleEntry.project_id == project_id).all()
    }

    created_entries = []
    for entry in generated_entries:
        key = (entry.get("source_type"), entry.get("source_id"), entry.get("title"))
        if key in existing_keys:
            continue

        db_entry = StoryBibleEntry(project_id=project_id, **entry)
        db.add(db_entry)
        created_entries.append(db_entry)

    db.commit()
    for entry in created_entries:
        db.refresh(entry)

    return StoryBibleGenerateResponse(entries=created_entries, created_count=len(created_entries))


@router.put("/api/story-bible/{entry_id}", response_model=StoryBibleEntryResponse)
def update_story_bible_entry(entry_id: str, entry_update: StoryBibleEntryUpdate, db: Session = Depends(get_db)):
    """Update a story bible entry."""
    entry = db.query(StoryBibleEntry).filter(StoryBibleEntry.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Story bible entry not found")

    if entry_update.category is not None:
        entry.category = entry_update.category
    if entry_update.title is not None:
        entry.title = entry_update.title
    if entry_update.content is not None:
        entry.content = entry_update.content

    db.commit()
    db.refresh(entry)
    return entry


@router.delete("/api/story-bible/{entry_id}")
def delete_story_bible_entry(entry_id: str, db: Session = Depends(get_db)):
    """Delete a story bible entry."""
    entry = db.query(StoryBibleEntry).filter(StoryBibleEntry.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Story bible entry not found")

    db.delete(entry)
    db.commit()
    return {"message": "Story bible entry deleted successfully"}
