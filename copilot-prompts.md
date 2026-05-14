# AI-Story Copilot / DeepSeek V4 Pro 提示词包

> 用法：在 VS Code 中打开本仓库后，先把「总控提示词」完整发给 Copilot；之后按迭代阶段逐条发送对应任务提示词。每次让 Copilot 修改代码前，都要求它先阅读 `.clinerules` 和 `spec.md`，再给出计划，确认后再改代码。

## 0. 总控提示词（每次新会话先发）

```text
你现在是 AI-Story 项目的 AI Coding 助手，运行在 VS Code Copilot 中，底层模型是 DeepSeek V4 Pro。

请先阅读仓库根目录的 .clinerules 和 spec.md，并严格遵守其中的产品定位、开发优先级、代码组织、隐私安全和验收标准。

项目定位：AI-Story 不是普通 AI 聊天写小说工具，而是面向小说作者的「AI 创作资产管理 + 故事连续性检查 + 可分享 IP 孵化工作台」。后续开发必须围绕 Story Bible、剧情一致性、角色访谈、章节工作流、文风 DNA、模板、企划案和传播能力展开。

当前技术栈：
- 前端：React 18 + TypeScript + Vite，主要入口 frontend/src/App.tsx。
- 后端：FastAPI + SQLAlchemy + SQLite，主要入口 backend/app/main.py。
- 现有能力：项目、会话、消息、记忆、知识库、RAG、AI 对话、Story Bible、一致性检查。

工作方式：
1. 不要立刻改代码。先阅读相关文件并输出你理解到的当前架构。
2. 给出本次任务的实施计划，包括要改哪些文件、API 如何设计、前端入口在哪里、如何测试。
3. 等我确认后再修改代码。
4. 修改代码时保持最小可行改动，不要重写整个项目。
5. 后端新增功能按 api / service / models / schemas 分层。
6. 前端新增 API 类型写入 frontend/src/types/index.ts，API 调用统一写入 frontend/src/services/api.ts。
7. AI 返回必须尽量结构化，不要让前端解析自由文本。
8. 小说正文、未公开设定、上传文档、API Key 都视为敏感信息，不要写入日志或源码。
9. 每次完成后请告诉我修改了哪些文件、如何验证，并建议我运行：
   - python -m compileall backend/app
   - cd frontend && npm run build
   - git diff --check

如果你发现现有实现与 spec.md 冲突，请先说明冲突和取舍方案，不要擅自大改。
```

## 1. 代码库体检提示词

适合在正式开发前使用，让 Copilot 先理解项目。

```text
请对当前 AI-Story 代码库做一次体检。

请阅读：
- README.md
- .clinerules
- spec.md
- backend/app/main.py
- backend/app/models/models.py
- backend/app/schemas/schemas.py
- backend/app/services/ai_service.py
- backend/app/services/rag_service.py
- backend/app/api/chat.py
- backend/app/api/story_bible.py
- backend/app/api/consistency.py
- frontend/src/App.tsx
- frontend/src/services/api.ts
- frontend/src/types/index.ts
- frontend/src/context/StoreContext.tsx

请输出：
1. 当前已经实现的功能清单。
2. 后端 API 和数据模型概览。
3. 前端状态管理和页面结构概览。
4. 与 spec.md 相比，哪些功能已经完成，哪些只是部分完成，哪些还没开始。
5. 最建议下一步做的 3 个任务，并说明原因。

先不要修改任何代码。
```

## 2. Story Bible 增强提示词

```text
请实现 Story Bible 增强，但保持最小可行改动。

目标：
1. 为 StoryBibleEntry 增加 locked 和 confidence 字段。
2. 生成 Story Bible 时，不覆盖 locked=true 的条目。
3. 前端故事圣经列表中展示「锁定/未锁定」状态和置信度。
4. 用户可以编辑条目，并切换 locked 状态。
5. 聊天 system prompt 中优先注入 Story Bible，且明确锁定条目优先级更高。

请先阅读 .clinerules 和 spec.md，再检查现有 Story Bible 相关代码：
- backend/app/models/models.py
- backend/app/schemas/schemas.py
- backend/app/api/story_bible.py
- backend/app/services/story_bible_service.py
- backend/app/api/chat.py
- frontend/src/types/index.ts
- frontend/src/services/api.ts
- frontend/src/App.tsx

实施要求：
- 后端 schema、model、API response 保持一致。
- SQLite 现有数据库可能缺字段，请给出开发环境迁移/重建建议，必要时在代码中兼容旧字段。
- 前端必须有 loading/error/success toast。
- 不要引入大型 UI 库。
- 完成后列出测试命令。

请先输出实施计划，等我确认后再改代码。
```

## 3. 一致性检查增强提示词

```text
请增强剧情一致性检查器。

目标：
1. ConsistencyCheckRequest 增加 scope 和 include_knowledge_base 字段。
2. 后端一致性检查同时读取项目记忆、Story Bible 和相关 RAG 检索结果。
3. AI 返回结构化 issues：severity、type、issue、evidence、suggestion。
4. 前端增加开关：是否使用记忆、Story Bible、知识库。
5. 前端问题列表按 severity 排序，并显示高/中/低风险标签。
6. 不要自动改写用户原文，只给出证据和修复建议。

请先阅读 .clinerules 和 spec.md，并检查：
- backend/app/api/consistency.py
- backend/app/services/consistency_service.py
- backend/app/services/rag_service.py
- backend/app/models/models.py
- backend/app/schemas/schemas.py
- frontend/src/App.tsx
- frontend/src/types/index.ts
- frontend/src/services/api.ts

请先输出实施计划、数据流和错误处理方案，等我确认后再改代码。
```

## 4. 知识库文档管理增强提示词

```text
请增强前端知识库文档管理。

目标：
1. 用户点击某个知识库时，可以看到该知识库下的文档列表。
2. 文档列表展示 filename、created_at、metadata。
3. 支持删除单个文档；如果后端尚无删除文档 API，请补充。
4. 支持一个简单的「检索测试」输入框，用户输入 query 后展示 RAG 返回片段。
5. Story Bible 生成和一致性检查后续会用知识库，所以 UI 需要让用户知道哪些资料已经被系统吸收。

请先检查：
- backend/app/api/knowledge_bases.py
- backend/app/services/rag_service.py
- backend/app/models/models.py
- backend/app/schemas/schemas.py
- frontend/src/App.tsx
- frontend/src/services/api.ts
- frontend/src/types/index.ts

要求：
- 不要破坏现有上传流程。
- 删除文档时要同步处理数据库记录和向量库数据；如果当前 RAG service 不支持删除向量，请明确说明限制，并先实现数据库层删除或设计 TODO。
- 前端提供 loading、empty state、error toast。

请先给计划，等我确认后再改代码。
```

## 5. 角色访谈 / 角色扮演模拟器提示词

```text
请实现「角色访谈 / 角色扮演模拟器」MVP。

目标：
基于 Memory 中 type=character 的人物记忆，让 AI 以该角色身份回答作者问题，帮助测试角色声音和性格稳定性。

后端建议：
- 新增 backend/app/api/character_chat.py
- 新增 backend/app/services/character_service.py
- 在 backend/app/schemas/schemas.py 增加 CharacterInterviewRequest / CharacterInterviewResponse
- 在 backend/app/api/__init__.py 和 backend/app/main.py 注册 router

API：
POST /api/projects/{project_id}/characters/{memory_id}/interview

请求体：
- question: string
- conversation_history: 可选数组，包含 role/content

响应：
- answer: string
- voice_notes: string
- possible_new_memory: string | null

Prompt 要求：
- 必须以角色身份回答，不要跳出角色说「我是 AI」。
- 使用该角色 Memory、项目 Story Bible、项目记忆作为上下文。
- 未定义信息不要硬编成事实，可以作为 possible_new_memory 给作者确认。
- 不要覆盖现有记忆。

前端要求：
- 在人物记忆卡片上增加「访谈」按钮。
- 打开一个简单访谈面板或 modal。
- 支持输入问题、展示回答、voice_notes、possible_new_memory。
- 提供「保存为记忆」或「保存到 Story Bible」的后续入口；如果本次不实现保存，请放一个 TODO 和不可点击说明。

请先阅读 .clinerules 和 spec.md，然后输出实施计划，等我确认后再改代码。
```

## 6. 小说企划案 / 投稿包生成提示词

```text
请实现「小说企划案 / 投稿包」MVP。

目标：
把项目名称、描述、记忆、Story Bible、知识库摘要和聊天内容整理成对外展示材料。

后端建议：
- 新增 backend/app/api/pitch.py
- 新增 backend/app/services/pitch_service.py
- schemas.py 增加 PitchGenerateResponse 等类型
- 注册 router

API：
POST /api/projects/{project_id}/pitch/generate

输出结构：
- logline
- synopsis
- selling_points: string[]
- main_characters: { name, role, hook }[]
- world_summary
- volume_outline: string[]
- target_audience
- social_posts: string[]
- cover_prompt

前端要求：
- 新增「企划案」入口，可先放在侧边栏 tab。
- 点击生成后展示结构化预览。
- 支持一键复制 Markdown。
- 提供 loading/error/success toast。

AI 要求：
- 不要虚构已经确定的关键设定；不确定处用「待作者确认」。
- 输出适合投稿和社媒传播，但不要过度夸张。

请先输出实施计划，等我确认后再改代码。
```

## 7. 章节工作流提示词

```text
请实现章节、场景和修订工作流的 MVP。

目标：
让 AI-Story 从聊天助手升级为写作工作台，支持项目下的章节管理。

后端：
- 在 backend/app/models/models.py 新增 Chapter 模型。
- 可选新增 Scene 模型；如果范围过大，本次只做 Chapter。
- 在 schemas.py 增加 ChapterCreate / ChapterUpdate / ChapterResponse。
- 新增 backend/app/api/chapters.py。
- 可选新增 backend/app/services/chapter_service.py。

Chapter 字段：
- id
- project_id
- title
- summary
- content
- status: outline / draft / revising / done
- order_index
- created_at
- updated_at

API：
- GET /api/projects/{project_id}/chapters
- POST /api/projects/{project_id}/chapters
- PUT /api/chapters/{chapter_id}
- DELETE /api/chapters/{chapter_id}

前端：
- 新增「章节」tab。
- 展示章节列表、状态、字数。
- 支持新建、编辑、删除章节。
- 编辑器可以先用 textarea，不要引入复杂富文本编辑器。
- 预留「一致性检查本章」按钮，可先调用现有 consistency-check。

请先输出数据库兼容方案、API 设计和前端状态方案，等我确认后再改代码。
```

## 8. 作者风格 DNA 提示词

```text
请实现「作者风格 DNA / 文风锁定」MVP。

目标：
用户粘贴自己的文本样本，系统分析文风规则，并可用于后续改写。

后端：
- 新增 AuthorStyleProfile 模型。
- 新增 backend/app/api/style.py。
- 新增 backend/app/services/style_service.py。
- schemas.py 增加 StyleProfileCreate / StyleProfileResponse / RewriteRequest / RewriteResponse。

字段：
- id
- project_id
- name
- sample_text
- style_summary
- rules_json
- created_at
- updated_at

API：
- POST /api/projects/{project_id}/style-profiles
- GET /api/projects/{project_id}/style-profiles
- POST /api/style-profiles/{style_id}/rewrite

AI 分析维度：
- 句长偏好
- 叙述视角
- 对话比例
- 情绪密度
- 常用修辞
- 节奏特点
- 禁用风格
- 示例改写规则

限制：
- 只能分析用户自己的样本文本，不要承诺模仿在世作者。
- 不要把 sample_text 打印到日志。

前端：
- 新增「文风 DNA」入口。
- 支持粘贴样本、生成分析、查看 rules、输入文本并按该风格改写。

请先输出实施计划和 prompt 设计，等我确认后再改代码。
```

## 9. 多模型 Provider / 本地模型模式提示词

```text
请重构 AIService，支持多模型 Provider 和本地 Ollama 模式的基础架构。

目标：
1. 保持现有 OpenAI 调用可用。
2. 增加 provider 抽象层，为 OpenAI、DeepSeek-compatible OpenAI API、Ollama 留接口。
3. 在 config.py 增加 ai_provider、openai_api_key、openai_api_base、ollama_base_url、default_model 等配置。
4. 新增 settings API：GET /api/settings/models 和 POST /api/settings/models/test。
5. 前端增加简单设置页或设置面板，显示当前 provider，并允许测试连接。

要求：
- 不要把 API Key 返回给前端。
- 本地模型模式 UI 明确提示「内容不发送到云端模型」。
- 云端模型模式 UI 明确提示内容会发送给对应服务商。
- Story Bible、Consistency、Chat 后续都必须继续通过统一 AIService 调用。
- 保持向后兼容，避免一次性大重构导致现有功能不可用。

请先阅读 backend/app/services/ai_service.py 和 backend/app/core/config.py，输出分阶段重构计划，等我确认后再改代码。
```

## 10. 创作模板库提示词

```text
请实现「创作模板库」MVP。

目标：
用户可以从预设模板创建项目，也可以把当前项目导出为模板。

后端：
- 新增 ProjectTemplate 模型。
- 新增 backend/app/api/templates.py。
- schemas.py 增加 ProjectTemplateCreate / ProjectTemplateResponse。

字段：
- id
- name
- description
- genre
- template_data
- is_public
- created_at

API：
- GET /api/templates
- POST /api/templates
- POST /api/templates/{template_id}/create-project
- POST /api/projects/{project_id}/export-template

内置模板建议：
- 玄幻升级流
- 悬疑推理
- 都市异能
- 恋爱群像
- 科幻探索

前端：
- 新增「模板库」入口。
- 展示模板卡片。
- 点击模板可预览模板内容并创建项目。
- 支持从当前项目导出模板。

要求：
- template_data 必须结构化，至少包含 memories 和 story_bible_entries。
- 创建项目时要复制模板里的初始记忆和 Story Bible 条目。
- 公开/私有字段先保留，暂不做社区发布。

请先输出实施计划，等我确认后再改代码。
```

## 11. 内容传播助手提示词

```text
请实现「小说内容传播助手」MVP。

目标：
把项目记忆、Story Bible、章节摘要转化为社媒宣传内容。

后端：
- 新增 backend/app/api/promotion.py
- 新增 backend/app/services/promotion_service.py
- schemas.py 增加 PromotionGenerateRequest / PromotionGenerateResponse

API：
POST /api/projects/{project_id}/promotion/generate

请求体：
- platform: xiaohongshu / weibo / douyin / bilibili / twitter
- content_type: character_card / chapter_teaser / world_intro / short_video_script / interactive_question / pitch_intro
- tone
- target_reader

响应：
- title
- body
- hashtags
- call_to_action
- variants

前端：
- 新增「传播助手」入口。
- 表单选择平台、内容类型、语气、目标读者。
- 展示生成结果并支持一键复制。

要求：
- 不要生成虚假的获奖、销量、榜单信息。
- 不要泄露用户未选择公开的敏感设定。
- 文案要适合分享，但不过度标题党。

请先输出实施计划，等我确认后再改代码。
```

## 12. 关系图谱与时间线提示词

```text
请实现「关系图谱 + 时间线可视化」MVP。

目标：
从 Memory 和 Story Bible 中提取人物、势力、地点、事件，并用简单可视化展示。

后端：
- 新增 StoryNode、StoryEdge、TimelineEvent 模型。
- 新增 backend/app/api/graph.py。
- 新增 backend/app/services/graph_service.py。
- schemas.py 增加相关请求/响应类型。

API：
- GET /api/projects/{project_id}/graph
- POST /api/projects/{project_id}/graph/generate
- GET /api/projects/{project_id}/timeline
- POST /api/projects/{project_id}/timeline/generate

前端：
- 新增「图谱」入口。
- MVP 先用 HTML/CSS 或 SVG 展示节点和边，不要引入大型图库。
- 时间线用纵向列表展示 event_order、time_label、title、description。
- 支持手动编辑节点、边、事件；如果本次范围太大，至少支持生成和展示，并列出 TODO。

要求：
- AI 生成节点/边/事件时必须保留 source_id 或 source_type，方便追溯。
- 不确定的关系不要写成铁定事实，应放在 description 中说明置信度。

请先输出实施计划，等我确认后再改代码。
```

## 13. 每次改完代码后的验收提示词

```text
请对你刚才完成的改动做自检。

请输出：
1. 修改文件清单和每个文件的作用。
2. 新增/修改的 API 列表。
3. 新增/修改的数据模型和 TypeScript 类型。
4. 前端用户操作路径。
5. 可能的数据库迁移或兼容问题。
6. 隐私和安全注意点。
7. 建议我运行的检查命令。

请重点检查：
- 是否遵守 .clinerules 和 spec.md。
- 是否把 API 调用集中在 frontend/src/services/api.ts。
- 是否把类型集中在 frontend/src/types/index.ts。
- 是否按 project_id 做数据隔离。
- 是否避免在日志中输出稿件全文或 API Key。
- 是否没有把 AI 自由文本直接当成唯一数据源。
```

## 14. Bug 修复提示词模板

```text
当前功能出现 Bug。请你先定位问题，不要立刻重写。

Bug 描述：
【在这里粘贴具体问题、报错、复现步骤】

请你：
1. 阅读相关代码和错误信息。
2. 解释最可能的根因。
3. 给出最小修复方案。
4. 说明是否会影响现有 API、数据库或前端类型。
5. 等我确认后再修改代码。

修复时请遵守 .clinerules 和 spec.md，不要为了修一个点大范围重构。
```

## 15. UI 优化提示词模板

```text
请优化当前页面 UI，但不要改变业务逻辑。

目标页面/区域：
【写明页面，例如 Story Bible tab / 一致性检查面板 / 记忆列表】

优化目标：
【写明希望改善的问题，例如层级不清、按钮太多、空状态不明显、移动端体验差】

要求：
1. 保持中文作者工具语气。
2. 不引入新的大型 UI 框架。
3. 不改变现有 API 行为。
4. 保留 loading、empty、error、success 状态。
5. 如果改动较明显，请说明我应该如何本地截图验收。

请先输出 UI 调整计划，等我确认后再改代码。
```
