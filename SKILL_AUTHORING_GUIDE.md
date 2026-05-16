# Skill Authoring Guide

> **本文规范如何在 AI-Story 项目中编写一个合规的 skill。**  
> **任何新建 skill 或修改现有 skill 之前，AI 必须完整阅读本文。**
>
> 当前版本：v1.0  
> 修订日期：2026-05-16  
> 上游约束：[ARCHITECTURE.md](./ARCHITECTURE.md)

## 0. 什么是一个 skill

在本项目里，一个 skill 是 `skills/` 下的一个独立子目录，对应一个**单一职责的 AI 能力**。

它必须满足：

1. 符合 Anthropic Agent Skills 开放标准（YAML frontmatter + Markdown body）
2. **能脱离 app/ 独立运行**（这是项目的灵魂，任何破坏这条的改动都拒绝）
3. 通过 `import ai_story_core` 调用 L1 能力，不依赖任何 web 框架
4. 输出严格 JSON 并经过 Pydantic 校验，绝不输出自由文本

## 1. 标准目录结构

```
skills/<skill-name>/
├── SKILL.md              # 必须。Anthropic Agent Skills 标准入口
├── scripts/
│   └── main.py           # 必须。skill 的实际执行逻辑
├── resources/            # 可选。prompt 模板、规则文档等
│   ├── prompt.md
│   └── rubric.md
├── tests/                # 可选但强烈建议
│   └── test_main.py
└── README.md             # 可选。对外说明（SKILL.md 不显示给最终用户）
```

**命名约定**：

- skill 目录名用 kebab-case，全小写，与 `SKILL.md` 中的 `name` 字段一致
- 一个 skill 一个目录，不嵌套
- `main.py` 是入口，不要叫别的名字

## 2. SKILL.md 规范

### 2.1 文件结构

```markdown
---
name: <skill-name>
description: <单一职责描述，详见 2.3>
---

# <Human-readable title>

## 用途

<2-3 句话说明这个 skill 干什么、什么时候用>

## 使用方式

<具体的调用命令>

## 输入

<JSON schema 描述>

## 输出

<成功和失败两种情况的 JSON 示例>

## Token 预算

<单次运行预期 token 消耗，没有 LLM 调用就写 0>
```

### 2.2 frontmatter 必需字段

| 字段 | 类型 | 说明 |
|---|---|---|
| `name` | string | 与目录名一致，kebab-case |
| `description` | string | **决定路由准确性的核心字段**，详见 2.3 |

### 2.3 description 写作规范

`description` 是 Claude / Cursor / Codex 等 AI 工具决定"要不要触发这个 skill"的唯一依据。写不好 description，你的 skill 永远不会被调用，或者被错误地频繁触发。

**必须满足**：

- **单一职责**：一个 skill 只做一件事
- **具体到动作**：描述输入是什么、输出是什么，而不是"帮助用户做 X"
- **包含触发关键词**：作者可能用什么自然语言描述这个任务，关键词就要出现在 description 里
- **长度控制在 30-80 字**

**好的 description 示例**：

✅ `检查给定的小说章节文本是否与项目中已有的人物设定、世界观规则、时间线产生冲突，输出按严重程度分级的问题列表和证据。`

✅ `从用户提供的小说文本或聊天记录中提取人物、世界规则、地点、势力、伏笔等结构化设定条目，输出待审条目列表，不覆盖已锁定条目。`

**不好的 description 示例**：

❌ `帮助小说作者写作`（太宽泛，会被任何写作请求误触发）  
❌ `一致性检查`（太短，AI 无法判断输入输出）  
❌ `分析章节并生成详细的 markdown 格式报告，包含人物、剧情、设定、伏笔、节奏、爽点的全方位分析以及改进建议`（多职责，违反单一原则）

### 2.4 body 内容

Body 是 SKILL.md 在被 AI 选中后注入到上下文的内容。必须：

- 给出**精确的命令行调用方式**（不要让 AI 猜）
- 给出**输入 JSON 的 schema 或示例**
- 给出**输出 JSON 的成功和失败示例**
- 说明 **token 预算**（让用户知道这个 skill 跑一次大概花多少钱）

## 3. scripts/main.py 规范

### 3.1 入口约定

每个 skill 的入口是 `scripts/main.py`，行为遵守 Unix 工具规范：

- **输入**：从 `stdin` 读 JSON
- **成功输出**：往 `stdout` 写一个 JSON 对象，进程退出码 0
- **失败输出**：往 `stderr` 写一个 JSON 错误对象，进程退出码 1
- **日志/进度**：往 `stderr` 写人类可读文本（不影响 JSON 解析）

### 3.2 import 约束

**允许 import**：

- Python 标准库
- `ai_story_core` 及其子模块
- `pydantic`
- `pydantic` 的间接依赖

**禁止 import**：

- ❌ `fastapi` / `flask` / `django` 等任何 web 框架
- ❌ `sqlalchemy` / `sqlite3` 等任何 DB 库（数据访问走 `ai_story_core`）
- ❌ `app/backend` 下的任何模块
- ❌ 任何 skill 之间的相互 import（skill 之间是平级的）

### 3.3 错误处理模式

```python
try:
    # 主逻辑
    result = do_work(...)
    print(result.model_dump_json())
    return 0
except KnownBusinessError as e:
    error = ErrorEnvelope(
        error_type="business",
        error_code=e.code,
        message=str(e),
    )
    print(error.model_dump_json(), file=sys.stderr)
    return 1
except Exception as e:
    # 兜底，绝不让进程 crash 后 stdout 为空
    error = ErrorEnvelope(
        error_type="internal",
        error_code="UNEXPECTED",
        message=type(e).__name__,
        detail=str(e),
    )
    print(error.model_dump_json(), file=sys.stderr)
    return 1
```

**绝对禁止**：

- ❌ `raise` 异常后不输出任何 JSON（调用方无法解析）
- ❌ 在 stderr 里输出敏感信息（小说稿件全文、API Key）

## 4. Pydantic Schema 规范

### 4.1 输入 schema

每个 skill 必须定义 `<SkillName>Input` 类，继承 `pydantic.BaseModel`：

```python
class ContinuityCheckInput(BaseModel):
    text: str = Field(..., description="待检查的章节正文")
    project_root: Optional[str] = Field(default=None, description="项目根目录")
    severity_floor: Literal["low", "medium", "high"] = Field(default="low")
```

### 4.2 输出 schema

成功输出必须有对应的 `<SkillName>Output` 类：

```python
class ContinuityIssue(BaseModel):
    severity: Literal["low", "medium", "high"]
    type: str
    issue: str
    evidence: str
    suggestion: str

class ContinuityCheckOutput(BaseModel):
    issues: list[ContinuityIssue]
    checked_chars: int
    confidence: float = Field(ge=0.0, le=1.0)
```

### 4.3 错误 schema

全项目共用一个错误 envelope，定义在 `ai_story_core.schemas`：

```python
class ErrorEnvelope(BaseModel):
    error_type: Literal["business", "internal", "validation", "llm"]
    error_code: str
    message: str
    detail: Optional[str] = None
```

### 4.4 版本兼容

- 新增字段必须是 `Optional` 且有 `default`
- 不允许重命名已有字段（先 deprecated 标记，下一个大版本再删）
- 不允许收窄已有字段的类型

## 5. LLM 调用规范

### 5.1 通过 ai_story_core.llm

所有 LLM 调用必须走 `ai_story_core.llm` 模块，**不要直接 import openai / anthropic SDK**：

```python
from ai_story_core.llm import chat_json

result = chat_json(
    system_prompt=SYSTEM_PROMPT,
    user_message=user_input,
    response_schema=ContinuityCheckOutput,
    max_retries=2,
)
```

`chat_json` 由 core 提供，统一处理：

- Provider 切换（OpenAI / DeepSeek / Ollama）
- JSON 输出强制（function calling 或 JSON mode）
- 失败重试
- Token 计数

### 5.2 JSON 强制输出

LLM 必须返回严格 JSON。**不接受**返回 markdown 代码块包裹的 JSON、不接受附带解释文字。Prompt 末尾必须有：

```
请直接输出 JSON，不要包裹在 ``` 代码块中，不要加任何解释文字。
无法判断的字段返回 null 或空数组，不要编造。
```

### 5.3 重试与降级

- 默认重试 2 次，每次重试前把上一轮的错误信息塞给 LLM 让它修正
- 重试 3 次仍失败，输出 `error_type=llm` 错误
- **不接受静默降级**（比如返回空结果但 exit code 0）

### 5.4 Token 记账

`chat_json` 返回值包含 `usage` 字段。skill 应该把它累计后写入输出的可选字段 `_token_usage`，供 app 的 token 预算面板使用：

```python
result, usage = chat_json(...)
output = ContinuityCheckOutput(
    issues=result.issues,
    _token_usage=usage,
    ...
)
```

## 6. 数据访问规范

**绝对禁止**：

- ❌ 直接 `open(".aistory/bible.json")` 读写
- ❌ 直接 sqlite3 连接
- ❌ 跨过 ai_story_core 直接读写任何项目数据文件

**正确方式**：

```python
from ai_story_core import story_bible, rag, memories

entries = story_bible.search(project_root=root, query="...", top_k=5)
chunks = rag.search(project_root=root, query="...", top_k=10)
chars = memories.list_by_type(project_root=root, mem_type="character")
```

数据格式详见 [OPEN_STORY_BIBLE_FORMAT.md](./OPEN_STORY_BIBLE_FORMAT.md)。

## 7. 测试规范

### 7.1 测试位置

每个 skill 的测试放在 `skills/<skill-name>/tests/test_main.py`。

### 7.2 必须覆盖的路径

- 成功路径（典型输入 → 预期输出）
- 输入验证失败（缺字段、字段类型错）
- LLM 返回非法 JSON（mock 返回脏数据，确认重试和最终 error envelope）
- 空数据（项目刚创建，bible.json 为空）

### 7.3 Mock LLM 调用

不要在测试里真调 LLM。`ai_story_core.llm` 提供测试桩：

```python
from ai_story_core.llm.testing import mock_chat_json

def test_continuity_finds_character_conflict(monkeypatch):
    monkeypatch.setattr("ai_story_core.llm.chat_json", mock_chat_json({
        "issues": [{"severity": "high", ...}],
    }))
    # ... run skill
```

## 8. 完整最小示例：bible-stats

这是一个最简单的 skill，**不调用 LLM**，只读 Story Bible 输出统计。新建 skill 时可以从它复制起步。

### 8.1 目录

```
skills/bible-stats/
├── SKILL.md
├── scripts/
│   └── main.py
└── tests/
    └── test_main.py
```

### 8.2 SKILL.md

```markdown
---
name: bible-stats
description: 统计当前小说项目 .aistory/bible.json 中 Story Bible 条目的总数、按分类分布、锁定比例和平均置信度，输出 JSON 摘要。仅做统计，不修改任何数据。
---

# bible-stats

## 用途

快速查看当前 Story Bible 健康度：有多少条目、各类型分布、有多少被作者锁定、AI 自动提取条目的平均置信度。

## 使用方式

从项目根目录运行：

​```bash
echo '{"project_root": "."}' | python ${SKILL_DIR}/scripts/main.py
​```

不传任何输入时默认使用当前目录：

​```bash
python ${SKILL_DIR}/scripts/main.py < /dev/null
​```

## 输入

​```json
{ "project_root": "." }
​```

`project_root` 可选，默认当前目录。

## 输出

成功（stdout）：

​```json
{
  "total_entries": 47,
  "locked_entries": 12,
  "by_category": [
    {"category": "character", "count": 18},
    {"category": "world_rule", "count": 9}
  ],
  "average_confidence": 0.82
}
​```

失败（stderr）：

​```json
{"error_type": "internal", "error_code": "UNEXPECTED", "message": "FileNotFoundError"}
​```

## Token 预算

0（本地计算，不调用 LLM）。
```

### 8.3 scripts/main.py

```python
#!/usr/bin/env python3
"""bible-stats: report Story Bible summary statistics."""

import sys
from pathlib import Path
from typing import Optional

from pydantic import BaseModel, Field

from ai_story_core import story_bible
from ai_story_core.schemas import ErrorEnvelope


class StatsInput(BaseModel):
    project_root: Optional[str] = Field(default=None)


class CategoryCount(BaseModel):
    category: str
    count: int


class StatsOutput(BaseModel):
    total_entries: int
    locked_entries: int
    by_category: list[CategoryCount]
    average_confidence: float = Field(ge=0.0, le=1.0)


def main() -> int:
    try:
        raw = sys.stdin.read().strip()
        params = StatsInput.model_validate_json(raw) if raw else StatsInput()
        root = Path(params.project_root or ".")

        entries = story_bible.list_all(project_root=root)

        by_cat: dict[str, int] = {}
        for e in entries:
            by_cat[e.category] = by_cat.get(e.category, 0) + 1

        output = StatsOutput(
            total_entries=len(entries),
            locked_entries=sum(1 for e in entries if e.locked),
            by_category=[
                CategoryCount(category=k, count=v) for k, v in sorted(by_cat.items())
            ],
            average_confidence=(
                sum(e.confidence for e in entries) / len(entries) if entries else 0.0
            ),
        )
        print(output.model_dump_json())
        return 0

    except Exception as e:
        err = ErrorEnvelope(
            error_type="internal",
            error_code="UNEXPECTED",
            message=type(e).__name__,
            detail=str(e),
        )
        print(err.model_dump_json(), file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
```

## 9. 反模式

下列做法在 code review 时一律打回，不解释。

| 反模式 | 为什么不行 |
|---|---|
| Skill 里 `from fastapi import ...` | 破坏 skill 独立运行能力 |
| Skill 之间互相 import | skill 必须平级，协作通过 app 编排层 |
| description 写成"AI 创作助手" | 路由会全部误触发或全不触发 |
| LLM 输出直接当数据用，不做 Pydantic 校验 | AI 自由文本污染下游 |
| 异常直接 raise 让进程崩 | 调用方收不到结构化错误 |
| 在 stderr 或日志里打印章节正文 | 隐私事故 |
| 把 prompt 写在 main.py 里几百行字符串拼接 | 不可维护，应放在 `resources/prompt.md` 然后读入 |
| 跨 skill 数据耦合（A skill 写一个非标准文件给 B skill 读） | 走标准 bible / memories 通道 |

## 10. 安装与分发

合规的 skill 应该能用以下任一方式安装并立刻工作：

**Claude Code**：

```bash
cp -r skills/<skill-name> ~/.claude/skills/
```

**Cursor / Codex CLI**：参考各自文档，目录约定基本一致。

**独立运行（不依赖任何 AI 工具）**：

```bash
echo '{"project_root":"."}' | python skills/<skill-name>/scripts/main.py
```

新 skill 合并前必须验证上述三种方式至少跑通**独立运行**和**Claude Code**。

## 11. 提交前 checklist

新 skill 的 PR 提交前，AI 必须输出以下自检清单：

- [ ] `SKILL.md` frontmatter 有 `name` 和 `description`
- [ ] `description` 单一职责，30-80 字
- [ ] `scripts/main.py` 只 import 了 ai_story_core 和标准库
- [ ] 输入输出都用 Pydantic schema 定义
- [ ] 异常路径走 ErrorEnvelope，不让进程裸崩
- [ ] LLM 调用走 `ai_story_core.llm.chat_json`
- [ ] 没有任何 `open(".aistory/...")` 之类的直接文件操作
- [ ] `tests/test_main.py` 至少覆盖成功路径 + 一种异常路径
- [ ] 独立运行命令在 README 或 SKILL.md 里有可复制示例
- [ ] 日志和 stderr 不输出稿件正文、API Key、上传文档全文

## 12. 修改本文件的规则

本文件是 skill 规范的事实标准。修改必须：

- 由项目所有者明确批准
- 同步评估对已存在 skill 的影响
- 更新版本号和修订日期
- 如果引入 breaking change，对应更新 ARCHITECTURE.md
