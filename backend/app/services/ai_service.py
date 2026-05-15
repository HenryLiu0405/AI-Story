from openai import OpenAI
from typing import List, Optional, Dict
from app.core.config import settings, AIProvider


class AIService:
    """AI Service with multi-provider support (OpenAI / DeepSeek / Ollama).

    All three providers expose an OpenAI-compatible API, so we use the same
    OpenAI SDK and simply switch base_url/api_key/model at runtime.
    """

    def __init__(self):
        self._client: Optional[OpenAI] = None
        self._resolved_provider: Optional[str] = None
        self._resolve()

    def _resolve(self):
        """Build an OpenAI SDK client from current provider settings."""
        provider: AIProvider = settings.ai_provider
        api_key = settings.current_api_key
        base_url = settings.current_api_base
        model = settings.current_model

        if provider == "ollama":
            # Ollama runs locally, no real auth needed; the SDK requires *something*
            api_key = "ollama"

        if api_key:
            self._client = OpenAI(api_key=api_key, base_url=base_url)
        else:
            self._client = None

        self._resolved_provider = provider
        self.model = model

    def is_configured(self) -> bool:
        return self._client is not None

    @property
    def provider(self) -> Optional[str]:
        return self._resolved_provider

    @property
    def is_local(self) -> bool:
        return self._resolved_provider == "ollama"

    async def chat(
        self,
        messages: List[Dict[str, str]],
        system_prompt: Optional[str] = None,
        temperature: float = 0.7
    ) -> str:
        """Generate chat completion (kept backward-compatible)."""
        if not self._client:
            return "AI服务未配置，请在设置中配置API密钥"

        full_messages = []
        if system_prompt:
            full_messages.append({"role": "system", "content": system_prompt})
        full_messages.extend(messages)

        try:
            response = self._client.chat.completions.create(
                model=self.model,
                messages=full_messages,
                temperature=temperature
            )
            return response.choices[0].message.content
        except Exception as e:
            return f"AI响应错误: {str(e)}"

    def test_connection(self, provider: str, api_key: str, base_url: str, model: str) -> Dict[str, str]:
        """Test connectivity for an arbitrary provider config.

        Returns a dict with keys 'success' (bool as str) and 'message'.
        Does NOT mutate the service's own client.
        """
        try:
            test_key = api_key
            if provider == "ollama":
                test_key = "ollama"

            test_client = OpenAI(api_key=test_key, base_url=base_url)
            response = test_client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": "回复'连接测试成功'"}],
                max_tokens=20,
                temperature=0
            )
            reply = response.choices[0].message.content
            return {"success": "true", "message": reply or "连接成功"}
        except Exception as e:
            return {"success": "false", "message": str(e)}

    def build_system_prompt(
        self,
        project_name: str,
        memories: List[Dict[str, str]],
        knowledge_context: Optional[str] = None,
        story_bible: Optional[List[Dict[str, str]]] = None
    ) -> str:
        """Build system prompt with project context."""
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
