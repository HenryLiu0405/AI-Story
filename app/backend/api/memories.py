from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models.models import Memory, Project, MemoryType
from app.schemas.schemas import MemoryCreate, MemoryUpdate, MemoryResponse

router = APIRouter(tags=["memories"])

@router.post("/api/projects/{project_id}/memories", response_model=MemoryResponse)
def create_memory(project_id: str, memory: MemoryCreate, db: Session = Depends(get_db)):
    """Create a new memory in a project"""
    # Check if project exists
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    db_memory = Memory(
        project_id=project_id,
        type=memory.type,
        title=memory.title,
        content=memory.content
    )
    db.add(db_memory)
    db.commit()
    db.refresh(db_memory)
    return db_memory

@router.get("/api/projects/{project_id}/memories", response_model=List[MemoryResponse])
def get_project_memories(project_id: str, db: Session = Depends(get_db)):
    """Get all memories in a project"""
    # Check if project exists
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    return db.query(Memory).filter(
        Memory.project_id == project_id
    ).order_by(Memory.created_at.desc()).all()

@router.get("/api/projects/{project_id}/memories/type/{memory_type}", response_model=List[MemoryResponse])
def get_memories_by_type(project_id: str, memory_type: str, db: Session = Depends(get_db)):
    """Get memories by type in a project"""
    # Check if project exists
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    return db.query(Memory).filter(
        Memory.project_id == project_id,
        Memory.type == memory_type
    ).order_by(Memory.created_at.desc()).all()

@router.put("/api/memories/{memory_id}", response_model=MemoryResponse)
def update_memory(memory_id: str, memory_update: MemoryUpdate, db: Session = Depends(get_db)):
    """Update a memory"""
    memory = db.query(Memory).filter(Memory.id == memory_id).first()
    if not memory:
        raise HTTPException(status_code=404, detail="Memory not found")
    
    if memory_update.type is not None:
        memory.type = memory_update.type
    if memory_update.title is not None:
        memory.title = memory_update.title
    if memory_update.content is not None:
        memory.content = memory_update.content
    
    db.commit()
    db.refresh(memory)
    return memory

@router.delete("/api/memories/{memory_id}")
def delete_memory(memory_id: str, db: Session = Depends(get_db)):
    """Delete a memory"""
    memory = db.query(Memory).filter(Memory.id == memory_id).first()
    if not memory:
        raise HTTPException(status_code=404, detail="Memory not found")
    
    db.delete(memory)
    db.commit()
    return {"message": "Memory deleted successfully"}
