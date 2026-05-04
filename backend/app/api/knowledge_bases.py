from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import os

from app.core.database import get_db
from app.core.config import settings
from app.models.models import KnowledgeBase, Document, Project
from app.schemas.schemas import KnowledgeBaseCreate, KnowledgeBaseResponse, DocumentResponse

router = APIRouter(tags=["knowledge_bases"])

@router.post("/api/projects/{project_id}/knowledge-bases", response_model=KnowledgeBaseResponse)
def create_knowledge_base(project_id: str, kb: KnowledgeBaseCreate, db: Session = Depends(get_db)):
    """Create a new knowledge base in a project"""
    # Check if project exists
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    db_kb = KnowledgeBase(
        project_id=project_id,
        name=kb.name,
        description=kb.description or ""
    )
    db.add(db_kb)
    db.commit()
    db.refresh(db_kb)
    return db_kb

@router.get("/api/projects/{project_id}/knowledge-bases", response_model=List[KnowledgeBaseResponse])
def get_project_knowledge_bases(project_id: str, db: Session = Depends(get_db)):
    """Get all knowledge bases in a project"""
    # Check if project exists
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    return db.query(KnowledgeBase).filter(
        KnowledgeBase.project_id == project_id
    ).order_by(KnowledgeBase.created_at.desc()).all()

@router.delete("/api/knowledge-bases/{kb_id}")
def delete_knowledge_base(kb_id: str, db: Session = Depends(get_db)):
    """Delete a knowledge base"""
    kb = db.query(KnowledgeBase).filter(KnowledgeBase.id == kb_id).first()
    if not kb:
        raise HTTPException(status_code=404, detail="Knowledge base not found")
    
    db.delete(kb)
    db.commit()
    return {"message": "Knowledge base deleted successfully"}

@router.get("/api/knowledge-bases/{kb_id}/documents", response_model=List[DocumentResponse])
def get_kb_documents(kb_id: str, db: Session = Depends(get_db)):
    """Get all documents in a knowledge base"""
    kb = db.query(KnowledgeBase).filter(KnowledgeBase.id == kb_id).first()
    if not kb:
        raise HTTPException(status_code=404, detail="Knowledge base not found")
    
    return db.query(Document).filter(
        Document.knowledge_base_id == kb_id
    ).order_by(Document.created_at.desc()).all()

@router.post("/api/knowledge-bases/{kb_id}/upload")
async def upload_document(kb_id: str, file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Upload a document to a knowledge base"""
    kb = db.query(KnowledgeBase).filter(KnowledgeBase.id == kb_id).first()
    if not kb:
        raise HTTPException(status_code=404, detail="Knowledge base not found")
    
    # Read file content
    content = await file.read()
    
    # For text files, decode the content
    try:
        text_content = content.decode('utf-8')
    except:
        text_content = content.decode('latin-1')
    
    # Create document record
    db_doc = Document(
        knowledge_base_id=kb_id,
        filename=file.filename,
        content=text_content,
        metadata={"original_filename": file.filename}
    )
    db.add(db_doc)
    db.commit()
    db.refresh(db_doc)
    
    return {
        "id": db_doc.id,
        "filename": db_doc.filename,
        "message": "Document uploaded successfully"
    }
