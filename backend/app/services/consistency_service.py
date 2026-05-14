import json
from typing import Dict, List, Optional

from app.models.models import Memory, StoryBibleEntry
from app.services.ai_service import ai_service


class ConsistencyService:
    """Consistency checker — lightweight and AI-powered."""

    def check(
        self,
        text: str,
        memories: List[Memory],
        story_bible_entries: List[StoryBibleEntry],
        kb_contexts: Optional[List[Dict[str, str]]] = None,
        scope: Optional[List[str]] = None,
    ) -> List[Dict[str, str]]:
        normalized_text = text.strip()

        if not normalized_text:
            return [{
                "severity": "low",
                "type": "general",
                "issue": "待检查文本为空。",
                "evidence": "没有提供章节、片段或剧情描述。",
                "suggestion": "粘贴一段正文、章节大纲或剧情设定后再运行检查。",
            }]

        if ai_service.is_configured():
            return self._check_with_ai(normalized_text, memories, story_bible_entries, kb_contexts, scope)
        else:
            return self._check_lightweight(normalized_text, memories, story_bible_entries, scope)

    def _check_lightweight(
        self,
        normalized_text: str,
        memories: List[Memory],
        story_bible_entries: List[StoryBibleEntry],
        scope: Optional[List[str]] = None,
    ) -> List[Dict[str, str]]:
        issues = []

        context_items = []
        for memory in memories:
            context_items.append((memory.title, memory.content, "项目记忆", str(memory.type.value)))
        for entry in story_bible_entries:
            context_items.append((entry.title, entry.content, "故事圣经", str(entry.category.value)))

        for title, content, source, category in context_items:
            if scope and category not in scope:
                continue
            clean_title = (title or "").strip()
            clean_content = (content or "").strip()
            if clean_title and clean_title in normalized_text and clean_content:
                issues.append({
                    "severity": "low",
                    "type": self._map_category_to_type(category),
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

    def _check_with_ai(
        self,
        normalized_text: str,
        memories: List[Memory],
        story_bible_entries: List[StoryBibleEntry],
        kb_contexts: Optional[List[Dict[str, str]]],
        scope: Optional[List[str]] = None,
    ) -> List[Dict[str, str]]:
        # Build context for AI
        context_parts = []

        if memories:
            context_parts.append("=== 项目记忆 ===")
            for m in memories:
                context_parts.append(f"- [{m.type.value}] {m.title}: {m.content[:300]}")
        
        if story_bible_entries:
            context_parts.append("\n=== 故事圣经 ===")
            for e in story_bible_entries:
                context_parts.append(f"- [{e.category.value}] {e.title}: {e.content[:300]}")
        
        if kb_contexts:
            context_parts.append("\n=== 知识库检索结果 ===")
            for doc in kb_contexts:
                context_parts.append(f"- [{doc.get('source', 'KB')}] {doc.get('content', '')[:300]}")

        scope_hint = ""
        if scope:
            scope_hint = f"\n只检查以下类型的矛盾：{', '.join(scope)}。"

        prompt = f"""你是一个专业的小说一致性审校员。请检查以下文本是否与项目设定存在矛盾。

{chr(10).join(context_parts)}

=== 待检查文本 ===
{normalized_text[:4000]}

{scope_hint}

请以 JSON 数组格式返回发现的问题，每个问题包含以下字段：
- severity: "low" / "medium" / "high"
- type: "character" / "timeline" / "world_rule" / "plot" / "style" / "general"
- issue: 问题描述
- evidence: 与设定矛盾的具体证据，引用设定原文
- suggestion: 修改建议

如果没有发现问题，请返回空数组 []。最多返回 8 个问题。
只返回 JSON 数组，不要包含其他文本。"""

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
                    temperature=0.3
                )
            )
            # Parse JSON response
            json_start = response.find("[")
            json_end = response.rfind("]") + 1
            if json_start >= 0 and json_end > json_start:
                issues = json.loads(response[json_start:json_end])
                # Validate and normalize
                valid_issues = []
                for issue in issues:
                    if not isinstance(issue, dict):
                        continue
                    valid_issues.append({
                        "severity": issue.get("severity", "low"),
                        "type": issue.get("type", "general"),
                        "issue": issue.get("issue", ""),
                        "evidence": issue.get("evidence", ""),
                        "suggestion": issue.get("suggestion", ""),
                    })
                return valid_issues[:8] if valid_issues else [{
                    "severity": "low",
                    "type": "general",
                    "issue": "AI 检查未发现明显矛盾。",
                    "evidence": "AI 已审校全文和所有参考设定。",
                    "suggestion": "可以继续创作，或补充更多设定信息后再次检查。",
                }]
            else:
                return self._check_lightweight(normalized_text, memories, story_bible_entries, scope)
        except Exception:
            return self._check_lightweight(normalized_text, memories, story_bible_entries, scope)

    def _map_category_to_type(self, category: str) -> str:
        mapping = {
            "character": "character",
            "world": "world_rule",
            "world_rule": "world_rule",
            "plot": "plot",
            "plot_thread": "plot",
            "timeline": "timeline",
            "faction": "character",
            "location": "world_rule",
            "foreshadowing": "plot",
            "theme": "style",
            "style_rule": "style",
            "custom": "general",
            "note": "general",
        }
        return mapping.get(category, "general")


consistency_service = ConsistencyService()
