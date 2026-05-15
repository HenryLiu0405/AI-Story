"""Template API — list, create, delete templates; create project from template; export project as template."""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.models import Project, ProjectTemplate, TemplateGenre
from app.schemas.schemas import (
    CreateProjectFromTemplateRequest,
    ExportTemplateRequest,
    ProjectResponse,
    TemplateCreate,
    TemplateGenreEnum,
    TemplateResponse,
)
from app.services.template_service import template_service

router = APIRouter(prefix="/api", tags=["templates"])


# ------------------------------------------------------------------
# Template CRUD
# ------------------------------------------------------------------
@router.get("/templates", response_model=list[TemplateResponse])
def list_templates(
    genre: Optional[TemplateGenreEnum] = Query(None, description="按类型筛选"),
    db: Session = Depends(get_db),
):
    """List all public templates, optionally filtered by genre."""
    query = db.query(ProjectTemplate)
    if genre:
        query = query.filter(ProjectTemplate.genre == TemplateGenre(genre.value))
    templates = query.order_by(ProjectTemplate.created_at.desc()).all()
    return templates


@router.get("/templates/{template_id}", response_model=TemplateResponse)
def get_template(template_id: str, db: Session = Depends(get_db)):
    """Get a single template by ID."""
    template = db.query(ProjectTemplate).filter(ProjectTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return template


@router.post("/templates", response_model=TemplateResponse, status_code=201)
def create_template(data: TemplateCreate, db: Session = Depends(get_db)):
    """Create a custom template (from scratch or via export)."""
    template = ProjectTemplate(
        name=data.name,
        description=data.description or "",
        genre=TemplateGenre(data.genre.value),
        template_data=data.template_data.model_dump(),
        is_public=data.is_public,
    )
    db.add(template)
    db.commit()
    db.refresh(template)
    return template


@router.delete("/templates/{template_id}", status_code=204)
def delete_template(template_id: str, db: Session = Depends(get_db)):
    """Delete a template."""
    template = db.query(ProjectTemplate).filter(ProjectTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    db.delete(template)
    db.commit()


# ------------------------------------------------------------------
# Create project from template
# ------------------------------------------------------------------
@router.post(
    "/templates/{template_id}/create-project",
    response_model=ProjectResponse,
    status_code=201,
)
def create_project_from_template(
    template_id: str,
    data: Optional[CreateProjectFromTemplateRequest] = None,
    db: Session = Depends(get_db),
):
    """Create a new project from a template, copying all memories and story bible entries."""
    template = db.query(ProjectTemplate).filter(ProjectTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    name_override = data.name_override if data else None
    project = template_service.create_project_from_template(
        db, template, name_override=name_override
    )
    return project


# ------------------------------------------------------------------
# Export project as template
# ------------------------------------------------------------------
@router.post(
    "/projects/{project_id}/export-template",
    response_model=TemplateResponse,
    status_code=201,
)
def export_project_as_template(
    project_id: str,
    data: ExportTemplateRequest,
    db: Session = Depends(get_db),
):
    """Export an existing project as a reusable template."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    template = template_service.export_project_as_template(
        db,
        project,
        name=data.name,
        description=data.description or "",
        genre=TemplateGenre(data.genre.value),
        is_public=data.is_public,
    )
    return template
