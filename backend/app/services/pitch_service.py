"""Pitch / 企划案 service — aggregates all project assets and generates structured pitch material via AI."""

import json
from datetime import datetime
from typing import Dict, List, Optional

from app.models.models import Chapter, Memory, Project, StoryBibleEntry
from app.services.ai_service import ai_service


class PitchService:
    """Generate structured pitch / submission package from project data."""

    def generate_pitch(
        self,
        project: Project,
        memories: List[Memory],
        story_bible_entries: List[StoryBibleEntry],
        chapters: List[Chapter],
        kb_contexts: Optional[List[Dict[str, str]]] = None,
    ) -> Dict:
        """Build pitch from all available project data. Falls back to lightweight summary if AI unavailable."""
        if ai_service.is_configured():
            return self._generate_with_ai(project, memories, story_bible_entries, chapters, kb_contexts)
        else:
            return self._generate_lightweight(project, memories, story_bible_entries, chapters)

    # ------------------------------------------------------------------
    # AI-powered generation
    # ------------------------------------------------------------------
    def _generate_with_ai(
        self,
        project: Project,
        memories: List[Memory],
        story_bible_entries: List[StoryBibleEntry],
        chapters: List[Chapter],
        kb_contexts: Optional[List[Dict[str, str]]],
    ) -> Dict:
        context_parts = []

        # 1. Project info
        context_parts.append(f"=== 项目信息 ===")
        context_parts.append(f"项目名称：{project.name}")
        if project.description:
            context_parts.append(f"项目描述：{project.description}")

        # 2. Memories by type
        if memories:
            context_parts.append("\n=== 项目记忆 ===")
            memory_type_groups: Dict[str, List[str]] = {}
            for m in memories:
                memory_type_groups.setdefault(str(m.type.value), []).append(
                    f"- [{m.title}] {m.content[:400]}"
                )
            for mtype, items in memory_type_groups.items():
                context_parts.append(f"\n【{mtype}】")
                context_parts.extend(items)

        # 3. Story Bible entries by category
        if story_bible_entries:
            context_parts.append("\n=== 故事圣经 ===")
            cat_groups: Dict[str, List[str]] = {}
            for e in story_bible_entries:
                cat_groups.setdefault(str(e.category.value), []).append(
                    f"- [{e.title}] {'[已锁定]' if e.locked else ''} {e.content[:400]}"
                )
            for cat, items in cat_groups.items():
                context_parts.append(f"\n【{cat}】")
                context_parts.extend(items)

        # 4. Chapters
        if chapters:
            context_parts.append("\n=== 章节列表 ===")
            for ch in sorted(chapters, key=lambda c: c.order_index or 0):
                status_label = {"outline": "大纲", "draft": "草稿", "revising": "修订中", "done": "已完成"}.get(
                    str(ch.status.value) if hasattr(ch.status, 'value') else str(ch.status), "未知"
                )
                context_parts.append(f"- [{status_label}] {ch.title}")
                if ch.summary:
                    context_parts.append(f"  摘要：{ch.summary[:300]}")

        # 5. Knowledge base contexts
        if kb_contexts:
            context_parts.append("\n=== 知识库检索结果 ===")
            for doc in kb_contexts:
                context_parts.append(f"- [{doc.get('source', 'KB')}] {doc.get('content', '')[:300]}")

        # Build AI prompt
        context_text = "\n".join(context_parts)
        prompt = f"""你是一个专业的文学经纪人和出版编辑，擅长为小说作品撰写投稿材料、企划案和宣传文案。

请根据以下项目设定，生成一份完整的小说投稿企划案。如果某些信息不足，请根据已有信息合理推断，并在相关字段中注明「（信息不足，基于已有设定推断）」。

{context_text}

请以 JSON 格式返回，包含以下字段：
- logline: 一句话梗概（50-150字），必须抓人眼球，清晰传达核心冲突和独特卖点
- synopsis: 故事简介（200-500字），概括主线剧情、主要冲突和情感核心
- selling_points: 卖点列表（3-5条字符串数组），每条说明为什么这个故事有市场吸引力
- main_characters: 主要角色数组，每个角色包含 name（姓名）、role（身份/定位，如"主角"、"反派"、"女主"）、description（简介50-150字）
- world_summary: 世界观摘要（100-300字），概括故事世界的独特设定、规则体系或时代背景
- cover_prompt: 封面/海报AI绘图提示词（英文，适合 Midjourney / DALL·E），风格建议包含 mood、key elements、color palette、composition
- target_audience: 目标读者分析（50-200字），说明适合哪些读者群体
- social_posts: 社交媒体宣传文案（3条字符串数组），每条适合小红书/微博/抖音等平台，风格吸引目标读者

只返回 JSON，不要包含其他文本。"""

        import asyncio
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)

        try:
            response = loop.run_until_complete(
                ai_service.chat(
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.7,
                )
            )
            # Parse JSON
            json_start = response.find("{")
            json_end = response.rfind("}") + 1
            if json_start >= 0 and json_end > json_start:
                data = json.loads(response[json_start:json_end])
                return self._normalize_response(project.id, data)
            else:
                return self._generate_lightweight(project, memories, story_bible_entries, chapters)
        except Exception:
            return self._generate_lightweight(project, memories, story_bible_entries, chapters)

    # ------------------------------------------------------------------
    # Lightweight fallback (no AI configured)
    # ------------------------------------------------------------------
    def _generate_lightweight(
        self,
        project: Project,
        memories: List[Memory],
        story_bible_entries: List[StoryBibleEntry],
        chapters: List[Chapter],
    ) -> Dict:
        """Build a basic summary without AI, from structured data alone."""

        # Collect character info from memories and story bible
        character_memories = [m for m in memories if str(m.type.value) == "character"]
        character_entries = [
            e for e in story_bible_entries if str(e.category.value) == "character"
        ]

        main_characters = []
        seen_names = set()
        for m in character_memories:
            if m.title not in seen_names:
                seen_names.add(m.title)
                main_characters.append({
                    "name": m.title,
                    "role": "记忆角色",
                    "description": m.content[:150] if m.content else "",
                })
        for e in character_entries:
            if e.title not in seen_names:
                seen_names.add(e.title)
                main_characters.append({
                    "name": e.title,
                    "role": "故事圣经角色",
                    "description": e.content[:150] if e.content else "",
                })

        # World summary from world-rule / location entries
        world_parts = []
        for e in story_bible_entries:
            if str(e.category.value) in ("world_rule", "location", "faction"):
                world_parts.append(f"【{e.title}】{e.content[:200]}")
        world_summary = "\n".join(world_parts) if world_parts else "（暂无世界观设定数据）"

        # Synopsis from project description + chapters
        synopsis_parts = []
        if project.description:
            synopsis_parts.append(project.description)
        for ch in sorted(chapters, key=lambda c: c.order_index or 0)[:5]:
            if ch.summary:
                synopsis_parts.append(f"{ch.title}：{ch.summary[:200]}")
        synopsis = "\n\n".join(synopsis_parts) if synopsis_parts else "（暂无足够数据生成简介）"

        # Logline from project name + first character hint
        if character_memories:
            logline = f"《{project.name}》—— 围绕{character_memories[0].title}展开的故事。"
        elif project.description:
            logline = project.description[:150]
        else:
            logline = f"《{project.name}》—— （AI 未配置，无法生成完整梗概。请在设置中配置 AI 后重新生成）"

        return {
            "project_id": project.id,
            "logline": logline,
            "synopsis": synopsis,
            "selling_points": ["（AI 未配置，请在设置中配置 AI 后重新生成以获取卖点分析）"],
            "main_characters": main_characters,
            "world_summary": world_summary,
            "cover_prompt": "（AI 未配置，请配置 AI 后重新生成封面提示词）",
            "target_audience": "（AI 未配置，请配置 AI 后重新生成目标读者分析）",
            "social_posts": ["（AI 未配置，请配置 AI 后重新生成社媒文案）"],
            "generated_at": datetime.utcnow().isoformat(),
        }

    # ------------------------------------------------------------------
    # Normalize AI response
    # ------------------------------------------------------------------
    def _normalize_response(self, project_id: str, data: Dict) -> Dict:
        """Ensure all expected fields exist with sensible defaults."""
        characters = data.get("main_characters", [])
        if isinstance(characters, list):
            normalized_characters = []
            for c in characters:
                if isinstance(c, dict):
                    normalized_characters.append({
                        "name": str(c.get("name", "")).strip(),
                        "role": str(c.get("role", "")).strip(),
                        "description": str(c.get("description", "")).strip(),
                    })
        else:
            normalized_characters = []

        selling_points = data.get("selling_points", [])
        if not isinstance(selling_points, list):
            selling_points = []

        social_posts = data.get("social_posts", [])
        if not isinstance(social_posts, list):
            social_posts = []

        return {
            "project_id": project_id,
            "logline": str(data.get("logline", "")).strip(),
            "synopsis": str(data.get("synopsis", "")).strip(),
            "selling_points": [str(s).strip() for s in selling_points if str(s).strip()],
            "main_characters": normalized_characters,
            "world_summary": str(data.get("world_summary", "")).strip(),
            "cover_prompt": str(data.get("cover_prompt", "")).strip(),
            "target_audience": str(data.get("target_audience", "")).strip(),
            "social_posts": [str(s).strip() for s in social_posts if str(s).strip()],
            "generated_at": datetime.utcnow().isoformat(),
        }


pitch_service = PitchService()
