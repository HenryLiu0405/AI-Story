from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models.models import Session as SessionModel, Project
from app.schemas.schemas import SessionCreate, SessionUpdate, SessionResponse

router = APIRouter(tags=["sessions"])

@router.post("/api/projects/{project_id}/sessions", response_model=SessionResponse)
def create_session(project_id: str, session: SessionCreate, db: Session = Depends(get_db)):
    """Create a new session in a project"""
    # Check if project exists
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    db_session = SessionModel(
        project_id=project_id,
        name=session.name or "新会话"
    )
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session

@router.get("/api/projects/{project_id}/sessions", response_model=List[SessionResponse])
def get_project_sessions(project_id: str, db: Session = Depends(get_db)):
    """Get all sessions in a project"""
    # Check if project exists
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    return db.query(SessionModel).filter(
        SessionModel.project_id == project_id
    ).order_by(SessionModel.updated_at.desc()).all()

@router.get("/api/sessions/{session_id}", response_model=SessionResponse)
def get_session(session_id: str, db: Session = Depends(get_db)):
    """Get a single session"""
    session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session

@router.put("/api/sessions/{session_id}", response_model=SessionResponse)
def update_session(session_id: str, session_update: SessionUpdate, db: Session = Depends(get_db)):
    """Update a session"""
    session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if session_update.name is not None:
        session.name = session_update.name
    
    db.commit()
    db.refresh(session)
    return session

@router.delete("/api/sessions/{session_id}")
def delete_session(session_id: str, db: Session = Depends(get_db)):
    """Delete a session"""
    session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    db.delete(session)
    db.commit()
    return {"message": "Session deleted successfully"}
