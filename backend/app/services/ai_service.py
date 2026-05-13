from openai import OpenAI
from typing import List, Optional, Dict
from app.core.config import settings

class AIService:
    """AI Service for chat completion"""
    
    def __init__(self):
        self.client = None
        if settings.openai_api_key:
            self.client = OpenAI(
                api_key=settings.openai_api_key,
                base_url=settings.openai_api_base
            )
        self.model = settings.openai_model
    
    def is_configured(self) -> bool:
        """Check if AI is configured"""
        return self.client is not None
    
    async def chat(
        self,
        messages: List[Dict[str, str]],
        system_prompt: Optional[str] = None,
        temperature: float = 0.7
    ) -> str:
        """Generate chat completion"""
        if not self.client:
            return "AI服务未配置，请在设置中配置API密钥"
        
        # Prepare messages
        full_messages = []
        if system_prompt:
            full_messages.append({"role": "system", "content": system_prompt})
        full_messages.extend(messages)
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=full_messages,
                temperature=temperature
            )
            return response.choices[0].message.content
        except Exception as e:
            return f"AI响应错误: {str(e)}"
    
    def build_system_prompt(
        self,
        project_name: str,
        memories: List[Dict[str, str]],
        knowledge_context: Optional[str] = None,
        story_bible: Optional[List[Dict[str, str]]] = None
    ) -> str:
        """Build system prompt with project context"""
        prompt_parts = [
            "你是一个专业的小说创作助手，帮助用户进行小说构思、灵感讨论、人物设定和世界观搭建。",
            f"当前项目：{project_name}",
        ]
        
        if memories:
            prompt_parts.append("\n=== 项目记忆 ===")
            for mem in memories:
                prompt_parts.append(f"\n【{mem['title']}】（{mem['type']}）\n{mem['content']}")
        
        if story_bible:
            prompt_parts.append("\n=== 故事圣经 ===")
            for entry in story_bible:
                prompt_parts.append(f"\n【{entry['title']}】（{entry['category']}）\n{entry['content']}")

        if knowledge_context:
            prompt_parts.append("\n=== 外部知识 ===")
            prompt_parts.append(knowledge_context)
        
        prompt_parts.append("\n请结合以上信息，回答用户的问题，提供有价值的创作建议。")
        
        return "\n".join(prompt_parts)

ai_service = AIService()
