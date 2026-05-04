from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models.models import Message, Session as SessionModel, Project, Memory, Document, KnowledgeBase
from app.schemas.schemas import ChatRequest, ChatResponse, MessageResponse, SearchRequest, SearchResult
from app.services.ai_service import ai_service
from app.services.rag_service import rag_service

router = APIRouter(tags=["chat"])

@router.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest, db: Session = Depends(get_db)):
    """Send a message and get AI response"""
    # Check if session exists
    session = db.query(SessionModel).filter(SessionModel.id == request.session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Check if project exists
    project = db.query(Project).filter(Project.id == request.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Save user message
    user_message = Message(
        session_id=request.session_id,
        role="user",
        content=request.message
    )
    db.add(user_message)
    db.commit()
    
    # Get project memories
    memories = db.query(Memory).filter(Memory.project_id == request.project_id).all()
    memory_list = [
        {"type": m.type, "title": m.title, "content": m.content}
        for m in memories
    ]
    
    # Search knowledge base for relevant context
    knowledge_context = None
    context_used = []
    
    knowledge_bases = db.query(KnowledgeBase).filter(
        KnowledgeBase.project_id == request.project_id
    ).all()
    
    if knowledge_bases:
        search_results = rag_service.search(
            query=request.message,
            project_id=request.project_id,
            top_k=3
        )
        
        if search_results:
            context_parts = []
            for result in search_results:
                context_parts.append(f"[来自 {result.get('knowledge_base', '知识库')}]: {result['content']}")
                context_used.append(result['id'])
            
            knowledge_context = "\n\n".join(context_parts)
    
    # Build system prompt
    system_prompt = ai_service.build_system_prompt(
        project_name=project.name,
        memories=memory_list,
        knowledge_context=knowledge_context
    )
    
    # Get conversation history
    messages = db.query(Message).filter(
        Message.session_id == request.session_id
    ).order_by(Message.created_at.asc()).all()
    
    history = [
        {"role": msg.role, "content": msg.content}
        for msg in messages
    ]
    
    # Get AI response
    response_content = await ai_service.chat(
        messages=history,
        system_prompt=system_prompt
    )
    
    # Save AI response
    assistant_message = Message(
        session_id=request.session_id,
        role="assistant",
        content=response_content
    )
    db.add(assistant_message)
    db.commit()
    db.refresh(assistant_message)
    
    return ChatResponse(
        message=MessageResponse(
            id=assistant_message.id,
            session_id=assistant_message.session_id,
            role=assistant_message.role,
            content=assistant_message.content,
            created_at=assistant_message.created_at
        ),
        context_used=context_used
    )

@router.post("/api/search")
def search_knowledge(request: SearchRequest):
    """Search knowledge base"""
    results = rag_service.search(
        query=request.query,
        kb_id=request.knowledge_base_id,
        project_id=request.project_id,
        top_k=request.top_k
    )
    
    return [
        SearchResult(
            content=r['content'],
            metadata=r.get('metadata', {}),
            score=1 - r.get('distance', 0)  # Convert distance to similarity score
        )
        for r in results
    ]
