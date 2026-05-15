"""Promotion / 内容传播助手 service — generates platform-specific social media copy from project assets via AI."""

import json
import asyncio
from datetime import datetime
from typing import Dict, List, Optional

from app.models.models import Chapter, Memory, Project, StoryBibleEntry
from app.services.ai_service import ai_service


# ---------------------------------------------------------------------------
# Platform-specific prompt tuning
# ---------------------------------------------------------------------------

PLATFORM_STYLES: Dict[str, str] = {
    "xiaohongshu": (
        "小红书平台风格：使用丰富的emoji表情、种草分享语气、短段落分行、"
        "带#话题标签，像闺蜜/同好在安利好书。开头用标题党吸引点击，"
        "正文控制在300-800字，结尾加互动引导（如「你们觉得呢？」）。"
    ),
    "weibo": (
        "微博平台风格：简练有力，善用超话格式 #小说名#，适合转发传播。"
        "可以带一点热搜体质的话题感，正文140-500字，可加配图建议。"
    ),
    "douyin": (
        "抖音平台风格：口语化、节奏快、适合短视频口播或字幕形式。"
        "用短句制造悬念和反转，开头3秒抓人，正文控制在100-300字，"
        "像在讲故事一样自然流畅。"
    ),
    "bilibili": (
        "B站平台风格：年轻化、可玩梗、可用二次元/AcFun表达方式。"
        "适合专栏/动态形式，可以带一点吐槽或玩梗，200-600字，"
        "善用「」标注重点。"
    ),
    "twitter": (
        "Twitter platform style: concise, thread-friendly, English preferred. "
        "Use engaging hooks, 1-2 sentence punchy lines. Keep each tweet under 280 chars. "
        "Use hashtags sparingly but strategically."
    ),
}

CONTENT_TYPE_LABELS: Dict[str, str] = {
    "character_card": "角色卡文案",
    "chapter_teaser": "章节预告",
    "world_intro": "世界观介绍",
    "short_video_script": "短视频脚本",
    "interactive_question": "互动问题",
    "submission_intro": "投稿简介",
}

CONTENT_TYPE_PROMPTS: Dict[str, str] = {
    "character_card": (
        "生成角色卡宣传文案。突出角色的核心人设、萌点/苏点/爽点、标志性台词或行为，"
        "让读者一眼就想了解这个角色。"
    ),
    "chapter_teaser": (
        "生成章节预告/连载预告文案。用悬念钩子吸引读者追更，"
        "暗示本章/接下来的高能情节，但不要剧透关键转折。"
    ),
    "world_intro": (
        "生成世界观介绍文案。展示世界观最独特、最吸引人的设定亮点，"
        "让读者对这个世界产生好奇和沉浸欲。"
    ),
    "short_video_script": (
        "生成短视频口播脚本。包含开场钩子、核心内容、结尾互动引导。"
        "标注画面建议和字幕要点，适合直接用于抖音/B站短视频制作。"
    ),
    "interactive_question": (
        "生成读者互动问题。以作者身份向读者提问，引发评论区讨论。"
        "问题应与作品剧情/角色/世界观相关，能激发读者表达欲。"
    ),
    "submission_intro": (
        "生成投稿简介。适合向编辑或平台投稿时使用，包含作品亮点、"
        "市场定位、目标读者和核心竞争力。语气专业但不枯燥。"
    ),
}


class PromotionService:
    """Generate platform-specific social media copy from project assets."""

    def generate_promotion(
        self,
        project: Project,
        platform: str,
        content_type: str,
        tone: str,
        target_reader: str,
        memories: List[Memory],
        story_bible_entries: List[StoryBibleEntry],
        chapters: List[Chapter],
        kb_contexts: Optional[List[Dict[str, str]]] = None,
    ) -> Dict:
        """Generate promotion copy. Falls back to lightweight summary if AI unavailable."""
        if ai_service.is_configured():
            return self._generate_with_ai(
                project, platform, content_type, tone, target_reader,
                memories, story_bible_entries, chapters, kb_contexts,
            )
        else:
            return self._generate_lightweight(
                project, platform, content_type, tone, target_reader,
                memories, story_bible_entries, chapters,
            )

    # ------------------------------------------------------------------
    # AI-powered generation
    # ------------------------------------------------------------------
    def _generate_with_ai(
        self,
        project: Project,
        platform: str,
        content_type: str,
        tone: str,
        target_reader: str,
        memories: List[Memory],
        story_bible_entries: List[StoryBibleEntry],
        chapters: List[Chapter],
        kb_contexts: Optional[List[Dict[str, str]]],
    ) -> Dict:
        context_parts = []

        # 1. Project info
        context_parts.append(f"=== 项目信息 ===")
        context_parts.append(f"项目名称：《{project.name}》")
        if project.description:
            context_parts.append(f"项目描述：{project.description}")

        # 2. Memories by type
        if memories:
            context_parts.append("\n=== 项目记忆 ===")
            memory_type_groups: Dict[str, List[str]] = {}
            for m in memories:
                key = str(m.type.value) if hasattr(m.type, 'value') else str(m.type)
                memory_type_groups.setdefault(key, []).append(
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
                key = str(e.category.value) if hasattr(e.category, 'value') else str(e.category)
                locked_tag = " [已锁定]" if e.locked else ""
                cat_groups.setdefault(key, []).append(
                    f"- [{e.title}]{locked_tag} {e.content[:400]}"
                )
            for cat, items in cat_groups.items():
                context_parts.append(f"\n【{cat}】")
                context_parts.extend(items)

        # 4. Chapters
        if chapters:
            context_parts.append("\n=== 章节列表 ===")
            for ch in sorted(chapters, key=lambda c: c.order_index or 0):
                status_label = {
                    "outline": "大纲", "draft": "草稿",
                    "revising": "修订中", "done": "已完成",
                }.get(
                    str(ch.status.value) if hasattr(ch.status, 'value') else str(ch.status),
                    "未知",
                )
                context_parts.append(f"- [{status_label}] {ch.title}")
                if ch.summary:
                    context_parts.append(f"  摘要：{ch.summary[:300]}")

        # 5. Knowledge base contexts
        if kb_contexts:
            context_parts.append("\n=== 知识库检索结果 ===")
            for doc in kb_contexts:
                context_parts.append(
                    f"- [{doc.get('source', 'KB')}] {doc.get('content', '')[:300]}"
                )

        # Build AI prompt
        context_text = "\n".join(context_parts)
        platform_style = PLATFORM_STYLES.get(platform, PLATFORM_STYLES["xiaohongshu"])
        content_type_prompt = CONTENT_TYPE_PROMPTS.get(content_type, CONTENT_TYPE_PROMPTS["character_card"])
        content_type_label = CONTENT_TYPE_LABELS.get(content_type, content_type)

        prompt = f"""你是一个专业的小说宣发文案策划师，擅长为不同类型的小说作品撰写各社交平台的宣传内容。

请根据以下项目设定，生成一份适合在指定平台发布的{content_type_label}。

{context_text}

=== 生成要求 ===
- 目标平台：{platform}
- 内容类型：{content_type_label}
- 语气风格：{tone}
- 目标读者：{target_reader}

{platform_style}

{content_type_prompt}

请以 JSON 格式返回，包含以下字段：
- title: 文案标题/开头句（10-40字），必须吸引眼球
- content: 正文内容（Markdown格式，可含emoji），具体长度请参照平台风格要求
- hashtags: 推荐的话题标签数组（3-8个），如 ["#小说推荐", "#角色安利"]
- platform_tips: 发布建议（50-150字），如最佳发布时间、配图建议、互动策略等

只返回 JSON，不要包含其他文本。"""

        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)

        try:
            response = loop.run_until_complete(
                ai_service.chat(
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.8,
                )
            )
            json_start = response.find("{")
            json_end = response.rfind("}") + 1
            if json_start >= 0 and json_end > json_start:
                data = json.loads(response[json_start:json_end])
                return self._normalize_response(
                    project.id, platform, content_type, tone, target_reader, data,
                )
            else:
                return self._generate_lightweight(
                    project, platform, content_type, tone, target_reader,
                    memories, story_bible_entries, chapters,
                )
        except Exception:
            return self._generate_lightweight(
                project, platform, content_type, tone, target_reader,
                memories, story_bible_entries, chapters,
            )

    # ------------------------------------------------------------------
    # Lightweight fallback (no AI configured)
    # ------------------------------------------------------------------
    def _generate_lightweight(
        self,
        project: Project,
        platform: str,
        content_type: str,
        tone: str,
        target_reader: str,
        memories: List[Memory],
        story_bible_entries: List[StoryBibleEntry],
        chapters: List[Chapter],
    ) -> Dict:
        """Build basic promo copy without AI, from structured data alone."""

        content_type_label = CONTENT_TYPE_LABELS.get(content_type, content_type)
        platform_label = {
            "xiaohongshu": "小红书", "weibo": "微博", "douyin": "抖音",
            "bilibili": "B站", "twitter": "Twitter",
        }.get(platform, platform)

        # Build basic copy from project data
        title = f"《{project.name}》{content_type_label}"
        content_parts = [f"# 《{project.name}》\n"]

        if project.description:
            content_parts.append(f"{project.description}\n")

        # Character info
        character_memories = [m for m in memories if (
            str(m.type.value) if hasattr(m.type, 'value') else str(m.type)
        ) == "character"]
        if character_memories:
            content_parts.append("## 主要角色")
            for m in character_memories[:5]:
                content_parts.append(f"- **{m.title}**：{m.content[:150]}")

        # Chapter info
        if chapters:
            done_chapters = [c for c in chapters if (
                str(c.status.value) if hasattr(c.status, 'value') else str(c.status)
            ) == "done"]
            content_parts.append(f"\n已完成 {len(done_chapters)} 章，共 {len(chapters)} 章大纲")

        content_parts.append(
            f"\n---\n> （AI 未配置，以上为基础信息汇总。"
            f"请在设置中配置 AI 后重新生成{platform_label}风格文案）"
        )

        return {
            "project_id": project.id,
            "platform": platform,
            "content_type": content_type,
            "tone": tone,
            "target_reader": target_reader,
            "title": title,
            "content": "\n".join(content_parts),
            "hashtags": [f"#小说推荐", f"#{project.name}"],
            "platform_tips": "（AI 未配置，请配置 AI 后重新生成发布建议）",
            "generated_at": datetime.utcnow().isoformat(),
        }

    # ------------------------------------------------------------------
    # Normalize AI response
    # ------------------------------------------------------------------
    def _normalize_response(
        self,
        project_id: str,
        platform: str,
        content_type: str,
        tone: str,
        target_reader: str,
        data: Dict,
    ) -> Dict:
        """Ensure all expected fields exist with sensible defaults."""
        hashtags = data.get("hashtags", [])
        if not isinstance(hashtags, list):
            hashtags = []

        return {
            "project_id": project_id,
            "platform": platform,
            "content_type": content_type,
            "tone": tone,
            "target_reader": target_reader,
            "title": str(data.get("title", "")).strip(),
            "content": str(data.get("content", "")).strip(),
            "hashtags": [str(h).strip() for h in hashtags if str(h).strip()],
            "platform_tips": str(data.get("platform_tips", "")).strip(),
            "generated_at": datetime.utcnow().isoformat(),
        }


promotion_service = PromotionService()
