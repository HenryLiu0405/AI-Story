from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.models import Memory, Project, StoryBibleEntry
from app.schemas.schemas import CharacterInterviewRequest, CharacterInterviewResponse
from app.services.character_service import character_service

router = APIRouter(tags=["character_chat"])


@router.post(
    "/api/projects/{project_id}/characters/{memory_id}/interview",
    response_model=CharacterInterviewResponse,
)
def interview_character(
    project_id: str,
    memory_id: str,
    request: CharacterInterviewRequest,
    db: Session = Depends(get_db),
):
    """Let the AI role-play as a character from project memories.

    The AI will answer the question strictly in-character, without breaking
    the fourth wall. Also returns voice notes and optionally a new memory
    if new setting details emerged during the interview.
    """
    # Validate project exists
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Validate memory exists and belongs to project
    memory = (
        db.query(Memory)
        .filter(Memory.id == memory_id, Memory.project_id == project_id)
        .first()
    )
    if not memory:
        raise HTTPException(status_code=404, detail="Memory not found in this project")

    # Validate memory is character type
    if memory.type.value != "character":
        raise HTTPException(
            status_code=400,
            detail="Only character-type memories can be interviewed",
        )

    # Load relevant Story Bible entries for context
    story_bible_entries = (
        db.query(StoryBibleEntry)
        .filter(
            StoryBibleEntry.project_id == project_id,
            StoryBibleEntry.category.in_(
                ["character", "world_rule", "faction", "location"]
            ),
        )
        .all()
    )

    # Run interview
    result = character_service.interview(
        memory=memory,
        question=request.question,
        story_bible_entries=story_bible_entries,
        conversation_history=request.conversation_history,
    )

    return CharacterInterviewResponse(
        answer=result["answer"],
        voice_notes=result["voice_notes"],
        possible_new_memory=result.get("possible_new_memory"),
    )
