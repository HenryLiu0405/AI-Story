from typing import Dict, List

from app.models.models import Memory, StoryBibleEntry


class ConsistencyService:
    """Lightweight consistency checker for draft text against project context."""

    def check(
        self,
        text: str,
        memories: List[Memory],
        story_bible_entries: List[StoryBibleEntry],
    ) -> List[Dict[str, str]]:
        issues = []
        normalized_text = text.strip()

        if not normalized_text:
            return [{
                "severity": "low",
                "type": "input",
                "issue": "待检查文本为空。",
                "evidence": "没有提供章节、片段或剧情描述。",
                "suggestion": "粘贴一段正文、章节大纲或剧情设定后再运行检查。",
            }]

        context_items = []
        for memory in memories:
            context_items.append((memory.title, memory.content, "项目记忆"))
        for entry in story_bible_entries:
            context_items.append((entry.title, entry.content, "故事圣经"))

        for title, content, source in context_items:
            clean_title = (title or "").strip()
            clean_content = (content or "").strip()
            if clean_title and clean_title in normalized_text and clean_content:
                issues.append({
                    "severity": "low",
                    "type": "reference",
                    "issue": f"文本提到了《{clean_title}》，建议核对是否延续既有设定。",
                    "evidence": f"来源：{source}；设定摘要：{clean_content[:160]}",
                    "suggestion": "确认该角色、世界规则或剧情线在当前片段中的称谓、能力、动机和事件顺序没有变化。",
                })

        if not issues:
            issues.append({
                "severity": "low",
                "type": "general",
                "issue": "未发现明显的设定引用冲突。",
                "evidence": "当前轻量检查没有匹配到需要重点核对的记忆或故事圣经条目。",
                "suggestion": "建议补充更多人物、世界观、时间线条目，或启用更完整的 AI 审校流程来发现隐性矛盾。",
            })

        return issues[:8]


consistency_service = ConsistencyService()
