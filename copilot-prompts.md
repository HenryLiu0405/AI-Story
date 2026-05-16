# AI-Story Copilot / DeepSeek V4 Pro 提示词包

> **使用方法**：在 VS Code 中打开本仓库后，先把"总控提示词"完整发给 Copilot；之后按场景挑对应的任务提示词。所有提示词都基于 skill-first 架构（详见 [ARCHITECTURE.md](./ARCHITECTURE.md)）。

## 0. 总控提示词（每次新会话先发）

```text
你现在是 AI-Story 项目的 AI Coding 助手，底层模型是 DeepSeek V4 Pro。

本项目是面向小说创作者的 Open Agent Skills 套件 + 配套运行时，采用三层架构：
- L1: ai-story-core (Python 共享库)
- L2: ai-story-skills (符合 Agent Skills 开放标准的 skill 集合)
- L3: ai-story-app (GUI 与编排运行时，原 frontend+backend)

请在开始任何任务前完整阅读：
1. ARCHITECTURE.md（项目宪法）
2. .clinerules（开发规则和禁止事项）
3. SKILL_AUTHORING_GUIDE.md（如果任务涉及 skill）
4. OPEN_STORY_BIBLE_FORMAT.md（如果任务涉及数据存储）

工作方式：
1. 不要立刻改代码。先输出你对任务的理解，以及它属于哪一层（core / skills / app）。
2. 给出实施计划：要改哪些文件、为什么、影响范围。
3. 等我确认后再修改代码。
4. 修改时遵守最小可行改动原则，不要重写无关部分。
5. 后端新增功能严格按 api / service / models / schemas 分层。
6. 前端新增 API 类型写入 app/frontend/src/types/index.ts，API 调用统一写入 app/frontend/src/services/api.ts。
7. AI 返回必须结构化 JSON 并 Pydantic 校验，不要让前端解析自由文本。
8. 小说正文、未公开设定、上传文档、API Key 都是敏感信息，不要写入日志或源码。
9. 每次完成后输出修改清单和验证方法。
10. 不要跨层修改（做 skill 时不要顺手改 app；改 core 时不要修 skill 业务逻辑）。

如果发现 ARCHITECTURE.md 或 .clinerules 与现实代码冲突，先告诉我冲突点，不要擅自调整。
```

## 1. 代码库体检

适合在开始新一阶段开发前使用。

```text
请对当前 AI-Story 代码库做一次体检。

阅读：
- README.md
- ARCHITECTURE.md
- .clinerules
- core/ai_story_core/ 下全部文件
- skills/ 下所有 SKILL.md
- app/backend/app/main.py
- app/backend/app/api/__init__.py
- app/frontend/src/App.tsx
- app/frontend/src/services/api.ts

输出：
1. core/ 当前实现的模块清单和成熟度。
2. skills/ 当前存在的 skill 清单和状态。
3. app/ 中哪些功能已经下沉到 skill 或 core，哪些还停留在旧 backend service。
4. 与 ARCHITECTURE.md 对比：哪些边界被违反了（例如 skill 依赖了 app）。
5. 是否存在旧架构遗留代码（旧 service 文件、未迁移的旧 API 等）。
6. 最建议下一步做的 3 个任务，按优先级排序并说明原因。

不要修改任何代码。
```

## 2. 在 core/ 新增模块

```text
请在 ai-story-core 中新增模块 [模块名]。

目标：[一句话目标]

要求：
1. 阅读 ARCHITECTURE.md 第 3.1 节（L1 包含 / 禁止包含）。
2. 在 core/ai_story_core/ 下新建 [模块名].py。
3. 不引入 FastAPI / SQLAlchemy / 任何 web 依赖。
4. 所有公开函数必须 type-hinted 并有 docstring。
5. 所有结构化输入输出必须用 Pydantic 定义。
6. 必须有对应的 core/tests/test_[模块名].py，覆盖核心路径。
7. 在 core/pyproject.toml 的 [project.dependencies] 加入需要的包（保持精简）。

先输出实施计划：函数签名、Pydantic schema、测试用例清单。等我确认后再写代码。
```

## 3. 创建新 skill

```text
请在 skills/ 下新建 skill：[skill-name]

目标：[一句话目标]

阅读：
- ARCHITECTURE.md 第 3.2 节
- SKILL_AUTHORING_GUIDE.md（完整阅读）
- 已有 skill 作为参考（例如 skills/continuity-guardian/）

要求：
1. 目录结构：
   skills/[skill-name]/
     SKILL.md
     scripts/main.py
     resources/（如有需要）
2. SKILL.md frontmatter 必须有 name、description。description 必须单一职责、具体明确、能被 AI 直接用于路由。
3. scripts/main.py 只能 import ai_story_core 和标准库，不能依赖 app/ 下任何模块。
4. 输出严格 JSON 并用 Pydantic schema 校验。无法判断时返回空数组或 confidence:0，绝不编造。
5. 错误处理：捕获异常并输出结构化 error 字段，不要让 skip 卡死。
6. 加 token 预算注释：单次运行预期消耗 token 数量级。

第一步先输出三样东西，等我确认后再写实际逻辑：
1. SKILL.md 草稿（特别是 description）。
2. Pydantic 输出 schema。
3. main.py 函数骨架（只签名，不实现）。
```

## 4. 把 backend service 重构成 skill

```text
请把 app/backend/app/services/[service_name].py 中的核心 AI 能力重构成一个独立 skill。

阅读：
- 当前 service 文件完整内容
- ARCHITECTURE.md（特别是数据流和依赖方向）
- SKILL_AUTHORING_GUIDE.md

任务：
1. 识别该 service 中"纯 AI 任务"的部分（输入文本，调用 LLM，输出结构化结果）。
2. 把这部分逻辑提取到 skills/[skill-name]/scripts/main.py。
3. 把数据访问部分（如读 Story Bible、读章节）替换为 import ai_story_core。
4. 原 service 改为薄壳：通过 subprocess 调用 skill 脚本，或者直接 import skill 模块。
5. 原 FastAPI route 暂时保留并继续工作，确保前端不破坏。
6. 后续单独 PR 再决定是否把 route 也迁移走。

约束：
- 任何会导致现有前端功能失效的改动都需要我明确批准。
- 不要顺手"清理"无关代码。
- 旧 service 文件不要删除，只清空 AI 调用部分，留 TODO 注释指向新 skill。

先输出重构计划，等我确认后再写代码。
```

## 5. 为已有 skill 增强能力

```text
请为 skills/[skill-name] 增加能力：[新能力描述]

要求：
1. 阅读现有 SKILL.md 和 scripts/。
2. 判断这个新能力是否仍属于该 skill 的单一职责范围：
   - 如果是，扩展现有 main.py
   - 如果不是，建议新建一个独立 skill
3. 不要让 description 变得宽泛——这会破坏路由准确性。
4. 新增的子能力扩展 Pydantic 输出 schema 时，必须前向兼容（新字段 optional + default）。
5. 在 SKILL.md 中更新使用说明和示例。

先输出判断结论（扩展现有 vs 新建）和实施计划，等我确认。
```

## 6. 在 app/ 新增编排或可视化能力

```text
请在 app/ 中新增 [功能描述]。

要求：
1. 阅读 ARCHITECTURE.md 第 3.3 节（L3 核心职责 / 关键约束）。
2. 这个功能必须属于以下之一：skill 编排、数据可视化、文件管理、设置面板、通知中心。
   如果是"原子 AI 任务"，停下来告诉我应该做成 skill，不要在 backend 里写 prompt。
3. 后端新增功能严格按 api / service / models / schemas 分层。AI 调用必须通过子进程调用 skill，不要在 backend 内写新 prompt。
4. 前端新组件放 app/frontend/src/components/，API 调用集中在 services/api.ts。
5. 类型同步到 app/frontend/src/types/index.ts。
6. 新增异步操作必须提供 loading / 空状态 / 错误提示 / 成功 toast。

先判断这个需求是不是真的属于 L3，再输出实施计划。
```

## 7. 验收 / 自检

每次完成代码改动后跑一遍。

```text
请对你刚才完成的改动做自检。

输出：
1. 修改的文件清单和所属层（core / skill / app）。
2. 是否新增了跨层依赖（如果有，标红警告）。
3. 是否破坏了"skill 独立可运行"原则（skill 必须能在没有 app 运行的情况下工作）。
4. 是否在 skill 里 import 了 FastAPI / SQLAlchemy（违规）。
5. 是否在 core 里写了任何 AI prompt（违规，prompt 是 skill 的工作）。
6. 是否在 app/backend 里写了新的 AI prompt（违规，应该调用 skill）。
7. AI 返回是否经过 Pydantic 校验，还是被当成自由文本使用。
8. 数据是否按 project_id 隔离。
9. 日志中是否输出了稿件全文、API Key、上传文档全文。
10. 建议运行的检查命令：
    - python -m compileall core/ai_story_core
    - cd app/frontend && npm run build
    - cd app/backend && python -m compileall app
    - git diff --check

任一项有问题立刻指出。
```

## 8. Bug 修复

```text
当前功能出现 Bug。先定位问题，不要立刻重写。

Bug 描述：
【粘贴问题、报错、复现步骤】

请：
1. 阅读相关代码和 ARCHITECTURE.md。
2. 判断 bug 在哪一层（core / skill / app）。
3. 解释最可能的根因。
4. 给出最小修复方案。
5. 说明是否会影响其他层。
6. 等我确认后再改代码。

不要为修一个点做跨层重构。如果根因在另一层，说清楚但不要擅自跨层改。
```

## 9. UI 优化

```text
请优化 app/frontend/ 中的 [页面/区域]，不改变业务逻辑。

优化目标：[具体问题]

要求：
1. 保持中文作者工具语气：清晰、克制、鼓励创作，不夸大 AI 能力。
2. 不引入新的大型 UI 框架。
3. 不改变现有 API 行为。
4. 保留 loading / empty / error / success 状态。
5. 改动较明显时说明本地截图验收方法。

先输出 UI 调整计划，等我确认。
```

## 10. 文档更新

```text
请更新文档 [文档名]，反映 [改动描述]。

要求：
1. 不修改 ARCHITECTURE.md（这是宪法，需要我亲自批准修改）。
2. 不修改 .clinerules（同上）。
3. 涉及 README.md 重写时，先输出大纲，不要直接写。
4. 文档之间引用要保持一致：如果你改了 A 的术语，B、C、D 里也要同步。
5. 不要复制粘贴 ARCHITECTURE.md 的内容到其他文档——应该引用，不应该复述。

先输出大纲和影响清单。
```

---

## 附：历史版本

旧版基于 monolithic 架构的提示词包已归档至 `docs/archive/copilot-prompts.v0.md`，仅供参考。**不要再使用旧版提示词，它会把 AI 带回旧架构**。
