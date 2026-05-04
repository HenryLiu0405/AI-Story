from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models.models import Message, Session as SessionModel
from app.schemas.schemas import MessageResponse

router = APIRouter(tags=["messages"])

@router.get("/api/sessions/{session_id}/messages", response_model=List[MessageResponse])
def get_session_messages(session_id: str, db: Session = Depends(get_db)):
    """Get all messages in a session"""
    session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return db.query(Message).filter(
        Message.session_id == session_id
    ).order_by(Message.created_at.asc()).all()

@router.delete("/api/sessions/{session_id}/messages")
def delete_session_messages(session_id: str, db: Session = Depends(get_db)):
    """Delete all messages in a session"""
    session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    db.query(Message).filter(Message.session_id == session_id).delete()
    db.commit()
    return {"message": "Messages deleted successfully"}
