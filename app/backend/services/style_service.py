"""Author Style DNA service — analyze writing style from samples and rewrite text in that style."""

import json
from typing import Dict, List, Optional, Tuple

from app.services.ai_service import ai_service


class StyleService:
    """Analyze an author's writing style and apply it via AI-powered rewriting."""

    # ------------------------------------------------------------------
    # Analyze
    # ------------------------------------------------------------------
    def analyze_style(self, sample_text: str) -> Dict:
        """Analyze sample text and return a structured StyleRulesJSON dict.

        Returns a dict with keys matching the backend StyleRulesJSON schema.
        If AI is not configured, returns a lightweight placeholder analysis.
        """
        if ai_service.is_configured():
            return self._analyze_with_ai(sample_text)
        else:
            return self._analyze_lightweight()

    def _analyze_with_ai(self, sample_text: str) -> Dict:
        prompt = f"""你是一个专业的文学风格分析师。请仔细分析以下文本样本的写作风格特征。

只基于样本实际表现出的特征进行分析，不要凭空编造。如果某个维度无法从样本中判断，请标注为"无法判断"。

=== 待分析文本样本 ===
{sample_text[:3000]}

=== 分析维度 ===
请对以下每个维度进行详细分析：

1. **句长偏好 (avg_sentence_length)**: 
   - 选项: short(短句为主,5-15字) / medium(中长句,15-35字) / long(长句为主,35字以上) / mixed(长短结合)
   - 用中文描述，例如："中长句为主，15-35字，偶有短句制造节奏变化"

2. **叙述视角 (narrative_pov)**:
   - 选项: first_person(第一人称) / third_person_limited(第三人称有限视角) / third_person_omniscient(第三人称全知) / second_person(第二人称) / mixed
   - 用中文描述，例如："第三人称有限视角，紧密跟随主角内心"

3. **对话比例 (dialogue_ratio)**:
   - 用中文描述对话占整体的比例和特点，例如："对话丰富，约占文本40%，对话与叙述交替推进剧情"

4. **情绪密度 (emotion_density)**:
   - 选项: low(克制冷静) / medium(适中) / high(情绪充沛)
   - 用中文描述，例如："情绪充沛，善于通过内心独白和环境烘托传达情感"

5. **常用修辞 (rhetorical_devices)**:
   - 列出样本中明显使用的修辞手法，如：比喻、排比、反问、拟人、夸张、对比、借代、设问等
   - 如果无明显修辞特征，返回空列表

6. **节奏特点 (pacing)**:
   - 选项: fast(快节奏,短句多,动作密集) / medium(中等) / slow(慢节奏,描写细腻)
   - 用中文描述，例如："快节奏，多短句和动作描写，段落切换频繁"

7. **禁用风格 (forbidden_styles)**:
   - 基于样本风格，列出改写时应避免的风格特征，例如："避免过度华丽的形容词堆砌"、"避免冗长的心理描写"
   - 如无明显需要避开的特征，返回空列表

8. **示例改写规则 (sample_rules)**:
   - 提供2-4条具体的改写规则，每条包含：
     - dimension: 维度名称
     - description: 规则描述（指导改写者如何应用）
     - example: 示例（"改写前: xxx → 改写后: xxx"）

请以 JSON 格式返回，结构如下：
{{
  "avg_sentence_length": "...",
  "narrative_pov": "...",
  "dialogue_ratio": "...",
  "emotion_density": "...",
  "rhetorical_devices": [...],
  "pacing": "...",
  "forbidden_styles": [...],
  "sample_rules": [
    {{"dimension": "...", "description": "...", "example": "..."}}
  ]
}}

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
                    temperature=0.3,
                )
            )
            json_start = response.find("{")
            json_end = response.rfind("}") + 1
            if json_start >= 0 and json_end > json_start:
                data = json.loads(response[json_start:json_end])
                return self._normalize_rules(data)
            else:
                return self._analyze_lightweight()
        except Exception:
            return self._analyze_lightweight()

    def _analyze_lightweight(self) -> Dict:
        """Return a placeholder analysis when AI is not available."""
        return {
            "avg_sentence_length": "（AI 未配置，无法分析）",
            "narrative_pov": "（AI 未配置，无法分析）",
            "dialogue_ratio": "（AI 未配置，无法分析）",
            "emotion_density": "（AI 未配置，无法分析）",
            "rhetorical_devices": [],
            "pacing": "（AI 未配置，无法分析）",
            "forbidden_styles": [],
            "sample_rules": [],
        }

    def _normalize_rules(self, raw: Dict) -> Dict:
        """Ensure the AI response has all expected keys with default fallbacks."""
        defaults = {
            "avg_sentence_length": "无法判断",
            "narrative_pov": "无法判断",
            "dialogue_ratio": "无法判断",
            "emotion_density": "无法判断",
            "rhetorical_devices": [],
            "pacing": "无法判断",
            "forbidden_styles": [],
            "sample_rules": [],
        }
        for key, default in defaults.items():
            if key not in raw or raw[key] is None:
                raw[key] = default
        return raw

    # ------------------------------------------------------------------
    # Summarize
    # ------------------------------------------------------------------
    def generate_summary(self, rules: Dict) -> str:
        """Generate a human-readable style summary from the rules JSON."""
        if not rules or rules.get("avg_sentence_length", "").startswith("（AI 未配置"):
            return "（AI 未配置，无法生成文风摘要。请在设置中配置 AI 后重新分析。）"

        if ai_service.is_configured():
            return self._summarize_with_ai(rules)
        else:
            return self._summarize_lightweight(rules)

    def _summarize_with_ai(self, rules: Dict) -> str:
        prompt = f"""你是一个文学编辑。请根据以下文风分析数据，用流畅的中文写一段100-200字的文风摘要，帮助作者理解自己的写作风格特征。

文风分析数据：
{json.dumps(rules, ensure_ascii=False, indent=2)}

要求：
- 语气友好、鼓励创作
- 突出最显著的2-3个特征
- 不要重复数据中的原始标签，用自然的文学评论语言描述
- 如果某维度是"无法判断"，略过不写

只返回摘要文本，不要包含其他内容。"""

        import asyncio
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)

        try:
            return loop.run_until_complete(
                ai_service.chat(
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.5,
                )
            ).strip()
        except Exception:
            return self._summarize_lightweight(rules)

    def _summarize_lightweight(self, rules: Dict) -> str:
        """Build a basic summary from structured data without AI."""
        parts = []
        sl = rules.get("avg_sentence_length", "")
        if sl and "无法" not in str(sl):
            parts.append(f"句长特征：{sl}")
        pov = rules.get("narrative_pov", "")
        if pov and "无法" not in str(pov):
            parts.append(f"叙述视角：{pov}")
        pacing = rules.get("pacing", "")
        if pacing and "无法" not in str(pacing):
            parts.append(f"节奏：{pacing}")
        devices = rules.get("rhetorical_devices", [])
        if devices:
            parts.append(f"常用修辞：{'、'.join(devices)}")
        return "；".join(parts) if parts else "（暂无足够数据生成文风摘要）"

    # ------------------------------------------------------------------
    # Rewrite
    # ------------------------------------------------------------------
    def rewrite_in_style(
        self, original_text: str, rules: Dict
    ) -> Tuple[str, str]:
        """Rewrite text in the given style. Returns (rewritten_text, changes_summary)."""
        if not original_text.strip():
            return original_text, "输入文本为空，无需改写。"

        if ai_service.is_configured():
            return self._rewrite_with_ai(original_text, rules)
        else:
            return self._rewrite_lightweight(original_text, rules)

    def _rewrite_with_ai(
        self, original_text: str, rules: Dict
    ) -> Tuple[str, str]:
        # Build style instructions from rules
        style_instructions = []
        sl = rules.get("avg_sentence_length", "")
        if sl and "无法" not in str(sl):
            style_instructions.append(f"- 句长控制：{sl}")
        pov = rules.get("narrative_pov", "")
        if pov and "无法" not in str(pov):
            style_instructions.append(f"- 叙述视角：{pov}")
        dr = rules.get("dialogue_ratio", "")
        if dr and "无法" not in str(dr):
            style_instructions.append(f"- 对话比例：{dr}")
        ed = rules.get("emotion_density", "")
        if ed and "无法" not in str(ed):
            style_instructions.append(f"- 情绪密度：{ed}")
        pacing = rules.get("pacing", "")
        if pacing and "无法" not in str(pacing):
            style_instructions.append(f"- 节奏：{pacing}")
        devices = rules.get("rhetorical_devices", [])
        if devices:
            style_instructions.append(f"- 修辞偏好：适当运用{'、'.join(devices)}")
        forbidden = rules.get("forbidden_styles", [])
        if forbidden:
            style_instructions.append(f"- 避免：{'；'.join(forbidden)}")
        sample_rules = rules.get("sample_rules", [])
        if sample_rules:
            rule_texts = []
            for r in sample_rules[:3]:
                dim = r.get("dimension", "")
                desc = r.get("description", "")
                ex = r.get("example", "")
                rule_texts.append(f"  [{dim}] {desc}" + (f" （示例：{ex}）" if ex else ""))
            if rule_texts:
                style_instructions.append("- 具体改写规则：\n" + "\n".join(rule_texts))

        instructions_block = "\n".join(style_instructions) if style_instructions else "（无具体风格规则）"

        prompt = f"""你是一个专业的文字编辑，擅长在不改变内容语义的前提下调整文风。

请按照以下风格规则改写文本。**保持原意、角色、情节和关键信息不变**，只调整文风特征（句式、修辞、节奏、语气等）。

=== 目标风格规则 ===
{instructions_block}

=== 原文 ===
{original_text}

=== 输出要求 ===
请以 JSON 格式返回：
{{
  "rewritten_text": "改写后的完整文本",
  "changes_summary": "简述做了哪些改动（50-100字）"
}}

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
                    temperature=0.4,
                )
            )
            json_start = response.find("{")
            json_end = response.rfind("}") + 1
            if json_start >= 0 and json_end > json_start:
                data = json.loads(response[json_start:json_end])
                return (
                    data.get("rewritten_text", original_text),
                    data.get("changes_summary", ""),
                )
            else:
                return self._rewrite_lightweight(original_text, rules)
        except Exception:
            return self._rewrite_lightweight(original_text, rules)

    def _rewrite_lightweight(
        self, original_text: str, rules: Dict
    ) -> Tuple[str, str]:
        return (
            original_text,
            "（AI 未配置，无法执行风格改写。请在设置中配置 AI 后重试。）",
        )


style_service = StyleService()
