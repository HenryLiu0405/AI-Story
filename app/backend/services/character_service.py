import json
import re
from typing import Dict, List, Optional

from app.models.models import Memory, StoryBibleEntry
from app.services.ai_service import ai_service


class CharacterService:
    """Character interview / role-play simulator.

    Constructs a character-specific system prompt and lets the AI answer
    questions strictly in-character, never breaking the fourth wall.
    """

    # Story Bible categories that are relevant for character context
    RELEVANT_SB_CATEGORIES = {"character", "world_rule", "faction", "location"}

    def interview(
        self,
        memory: Memory,
        question: str,
        story_bible_entries: List[StoryBibleEntry],
        conversation_history: Optional[List[Dict[str, str]]] = None,
    ) -> Dict:
        """Run a character interview turn.

        Args:
            memory: The character Memory (must be type=character).
            question: The user's question to the character.
            story_bible_entries: Relevant Story Bible entries for context.
            conversation_history: Previous Q&A turns in this interview session.

        Returns:
            Dict with keys: answer, voice_notes, possible_new_memory.
        """
        if memory.type.value != "character":
            return {
                "answer": "（该记忆不是人物类型，无法进行角色访谈。）",
                "voice_notes": "",
                "possible_new_memory": None,
            }

        if not question.strip():
            return {
                "answer": "（你好像没有说话……有什么想问我的吗？）",
                "voice_notes": "",
                "possible_new_memory": None,
            }

        if not ai_service.is_configured():
            return {
                "answer": "AI 服务未配置，请在设置中配置 API 密钥后再试。",
                "voice_notes": "",
                "possible_new_memory": None,
            }

        return self._interview_with_ai(
            memory, question.strip(), story_bible_entries, conversation_history
        )

    def _interview_with_ai(
        self,
        memory: Memory,
        question: str,
        story_bible_entries: List[StoryBibleEntry],
        conversation_history: Optional[List[Dict[str, str]]],
    ) -> Dict:
        system_prompt = self._build_character_system_prompt(
            memory, story_bible_entries
        )

        messages = [{"role": "system", "content": system_prompt}]

        # Inject conversation history
        if conversation_history:
            for turn in conversation_history:
                role = turn.get("role", "user")
                content = turn.get("content", "")
                if role in ("user", "assistant") and content.strip():
                    messages.append({"role": role, "content": content})

        # Append current question with structured output instruction
        user_prompt = f"""【用户的新问题】
{question}

请以角色身份回答以上问题。同时，在回答的最后用以下 JSON 格式（放在 ```json 代码块中）提供附加信息：

```json
{{
  "voice_notes": "分析该角色说话的语气特点、用词习惯、句式偏好等声线特征（1-3句话）",
  "possible_new_memory": {{
    "title": "如果访谈中出现了之前设定中未明确的新信息，提炼为一个简短标题（如：角色的隐藏恐惧），否则为null",
    "content": "如果出现了新设定，用1-2句话概括；否则为null"
  }}
}}
```

注意：voice_notes 必须始终提供。possible_new_memory 仅在有实质性新发现时提供，否则 title 和 content 都为 null。"""

        messages.append({"role": "user", "content": user_prompt})

        import asyncio
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)

        try:
            response = loop.run_until_complete(
                ai_service.chat(messages=messages, temperature=0.85)
            )

            answer = response
            voice_notes = ""
            possible_new_memory = None

            # Try to extract JSON block from response
            json_match = re.search(r"```json\s*(.*?)\s*```", response, re.DOTALL)
            if json_match:
                try:
                    extra = json.loads(json_match.group(1))
                    voice_notes = extra.get("voice_notes", "")
                    mn = extra.get("possible_new_memory")
                    if mn and isinstance(mn, dict) and mn.get("title") and mn.get("content"):
                        possible_new_memory = {
                            "title": str(mn["title"]),
                            "content": str(mn["content"]),
                        }
                    # Strip JSON block from answer text
                    answer = response[: json_match.start()].strip()
                    if not answer:
                        answer = response[json_match.end() :].strip()
                except (json.JSONDecodeError, TypeError):
                    pass

            # Fallback: if no JSON block, try to find bare JSON object at end
            if not voice_notes:
                json_match2 = re.search(
                    r'\{\s*"voice_notes"\s*:', response, re.DOTALL
                )
                if json_match2:
                    try:
                        extra = json.loads(response[json_match2.start():])
                        voice_notes = extra.get("voice_notes", "")
                        mn = extra.get("possible_new_memory")
                        if mn and isinstance(mn, dict) and mn.get("title") and mn.get("content"):
                            possible_new_memory = {
                                "title": str(mn["title"]),
                                "content": str(mn["content"]),
                            }
                        answer = response[: json_match2.start()].strip()
                    except (json.JSONDecodeError, TypeError):
                        pass

            return {
                "answer": answer or response,
                "voice_notes": voice_notes or self._fallback_voice_notes(memory),
                "possible_new_memory": possible_new_memory,
            }

        except Exception as e:
            return {
                "answer": f"（角色暂时无法回应：{str(e)}）",
                "voice_notes": "",
                "possible_new_memory": None,
            }

    def _build_character_system_prompt(
        self,
        memory: Memory,
        story_bible_entries: List[StoryBibleEntry],
    ) -> str:
        """Build the system prompt that locks the AI into character."""
        char_name = memory.title.strip()
        char_content = memory.content.strip()

        parts = [
            f"你正在扮演一个虚构角色。你的名字是「{char_name}」。",
            "",
            f"=== 你的角色设定 ===",
            char_content,
            "",
            "=== 角色扮演规则（必须严格遵守）===",
            "1. 你必须始终以「我」（第一人称）的口吻回答，就像你就是这个角色本人。",
            "2. 永远不要说你是一个 AI、语言模型、或者任何形式的程序。你不是在扮演，你就是这个角色。",
            "3. 不要跳出角色来解释任何事。即使被问到元问题（如「你是谁创造的」），也要以角色视角回答。",
            "4. 如果某个问题涉及设定中未定义的信息，请以角色的方式表达不确定性，例如：",
            '   - "我可能记不太清了……"',
            '   - "说实话，这件事我自己也在想……"',
            '   - "也许……我不太确定。"',
            "5. 保持角色性格、语气和情感的一致性。参考你的角色设定中的性格描写。",
            "6. 回答要自然、有对话感，像真人在聊天，而不是在写小说旁白。",
            "7. 可以适当展现角色的情感、犹豫、矛盾，让人物更立体。",
        ]

        # Inject relevant Story Bible entries
        if story_bible_entries:
            sb_parts = []
            for entry in story_bible_entries:
                category = entry.category.value if hasattr(entry.category, 'value') else str(entry.category)
                if category in self.RELEVANT_SB_CATEGORIES:
                    sb_parts.append(
                        f"- 【{self._sb_category_label(category)}】{entry.title}：{entry.content[:400]}"
                    )
            if sb_parts:
                parts.append("")
                parts.append("=== 你所在的世界（故事圣经）===")
                parts.append("以下是你所在世界的已知设定，请确保你的回答与这些设定一致：")
                parts.extend(sb_parts)

        parts.append("")
        parts.append("现在，用户将向你提问。请以角色的身份自然地回答。")

        return "\n".join(parts)

    @staticmethod
    def _sb_category_label(category: str) -> str:
        labels = {
            "character": "人物",
            "world_rule": "世界规则",
            "location": "地点",
            "faction": "势力",
            "timeline": "时间线",
            "plot_thread": "剧情线",
            "foreshadowing": "伏笔",
            "theme": "主题",
            "style_rule": "文风规则",
            "note": "笔记",
        }
        return labels.get(category, category)

    @staticmethod
    def _fallback_voice_notes(memory: Memory) -> str:
        """Generate a basic voice notes description from the character memory content."""
        content = memory.content[:200]
        notes = f"角色「{memory.title}」的声线特征暂未详细分析。"
        if "温柔" in content or "善良" in content:
            notes += "语气偏向温和。"
        if "暴躁" in content or "愤怒" in content:
            notes += "语气偏向激烈。"
        if "冷静" in content or "理智" in content:
            notes += "语气偏向冷静理性。"
        return notes


character_service = CharacterService()
