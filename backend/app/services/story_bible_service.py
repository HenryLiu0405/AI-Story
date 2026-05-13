from typing import Dict, List

from app.models.models import Memory, Message, StoryBibleCategory


MEMORY_CATEGORY_MAP = {
    "character": StoryBibleCategory.CHARACTER,
    "world": StoryBibleCategory.WORLD_RULE,
    "plot": StoryBibleCategory.PLOT_THREAD,
    "custom": StoryBibleCategory.NOTE,
}


class StoryBibleService:
    """Build project-level story bible entries from existing project material."""

    def build_entries_from_project(
        self,
        memories: List[Memory],
        messages: List[Message],
    ) -> List[Dict[str, str]]:
        entries = []
        seen_titles = set()

        for memory in memories:
            title = memory.title.strip()
            if not title or title in seen_titles:
                continue

            seen_titles.add(title)
            entries.append({
                "category": MEMORY_CATEGORY_MAP.get(str(memory.type.value), StoryBibleCategory.NOTE).value,
                "title": title,
                "content": memory.content.strip(),
                "source_type": "memory",
                "source_id": memory.id,
            })

        user_messages = [message for message in messages if str(message.role.value) == "user"]
        if user_messages:
            recent_notes = "\n\n".join(
                f"- {message.content.strip()}"
                for message in user_messages[-8:]
                if message.content.strip()
            )
            if recent_notes:
                entries.append({
                    "category": StoryBibleCategory.PLOT_THREAD.value,
                    "title": "近期剧情讨论摘要",
                    "content": recent_notes,
                    "source_type": "messages",
                    "source_id": None,
                })

        return entries


story_bible_service = StoryBibleService()
