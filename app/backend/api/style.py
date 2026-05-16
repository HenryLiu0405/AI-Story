"""Author Style DNA API — create, list, get, delete style profiles; rewrite text in style."""

from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.models import AuthorStyleProfile, Project
from app.schemas.schemas import (
    AuthorStyleProfileCreate,
    AuthorStyleProfileResponse,
    StyleRewriteRequest,
    StyleRewriteResponse,
)
from app.services.style_service import style_service

router = APIRouter(tags=["style"])


# ---------------------------------------------------------------------------
# List style profiles for a project
# ---------------------------------------------------------------------------
@router.get(
    "/api/projects/{project_id}/style-profiles",
    response_model=List[AuthorStyleProfileResponse],
)
def list_style_profiles(project_id: str, db: Session = Depends(get_db)):
    """Return all style profiles for the given project."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    profiles = (
        db.query(AuthorStyleProfile)
        .filter(AuthorStyleProfile.project_id == project_id)
        .order_by(AuthorStyleProfile.created_at.desc())
        .all()
    )
    return profiles


# ---------------------------------------------------------------------------
# Create a new style profile (analyze sample text → store result)
# ---------------------------------------------------------------------------
@router.post(
    "/api/projects/{project_id}/style-profiles",
    response_model=AuthorStyleProfileResponse,
    status_code=201,
)
def create_style_profile(
    project_id: str,
    request: AuthorStyleProfileCreate,
    db: Session = Depends(get_db),
):
    """Create a new author style profile by analyzing the provided sample text.

    The sample text is sent to AI for analysis across 6+ dimensions
    (sentence length, narrative POV, dialogue ratio, emotion density,
    rhetorical devices, pacing). The structured result is stored as
    rules_json and a human-readable summary is generated.
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Validate sample text length
    sample = request.sample_text.strip()
    if len(sample) < 50:
        raise HTTPException(
            status_code=400,
            detail="样本文本太短（至少需要50字），无法进行有效的文风分析。",
        )

    # Analyze style
    rules = style_service.analyze_style(sample)

    # Generate human-readable summary
    summary = style_service.generate_summary(rules)

    # Persist
    profile = AuthorStyleProfile(
        project_id=project_id,
        name=request.name.strip() or "未命名风格档案",
        sample_text=sample,
        style_summary=summary,
        rules_json=rules,
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile


# ---------------------------------------------------------------------------
# Get a single style profile
# ---------------------------------------------------------------------------
@router.get(
    "/api/style-profiles/{style_id}",
    response_model=AuthorStyleProfileResponse,
)
def get_style_profile(style_id: str, db: Session = Depends(get_db)):
    """Get a single style profile by ID."""
    profile = (
        db.query(AuthorStyleProfile)
        .filter(AuthorStyleProfile.id == style_id)
        .first()
    )
    if not profile:
        raise HTTPException(status_code=404, detail="Style profile not found")
    return profile


# ---------------------------------------------------------------------------
# Delete a style profile
# ---------------------------------------------------------------------------
@router.delete("/api/style-profiles/{style_id}", status_code=204)
def delete_style_profile(style_id: str, db: Session = Depends(get_db)):
    """Delete a style profile."""
    profile = (
        db.query(AuthorStyleProfile)
        .filter(AuthorStyleProfile.id == style_id)
        .first()
    )
    if not profile:
        raise HTTPException(status_code=404, detail="Style profile not found")
    db.delete(profile)
    db.commit()
    return None


# ---------------------------------------------------------------------------
# Rewrite text in a specific style
# ---------------------------------------------------------------------------
@router.post(
    "/api/style-profiles/{style_id}/rewrite",
    response_model=StyleRewriteResponse,
)
def rewrite_in_style(
    style_id: str,
    request: StyleRewriteRequest,
    db: Session = Depends(get_db),
):
    """Rewrite the given text to match the author style defined by the profile."""
    profile = (
        db.query(AuthorStyleProfile)
        .filter(AuthorStyleProfile.id == style_id)
        .first()
    )
    if not profile:
        raise HTTPException(status_code=404, detail="Style profile not found")

    rewritten_text, changes_summary = style_service.rewrite_in_style(
        request.text, profile.rules_json or {}
    )

    return StyleRewriteResponse(
        original_text=request.text,
        rewritten_text=rewritten_text,
        changes_summary=changes_summary,
    )
