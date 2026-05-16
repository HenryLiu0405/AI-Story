# AI-Story 产品规格说明

## 0. 一句话定位

AI-Story 是面向小说作者的 **AI 创作资产管理 + 故事连续性检查 + 可分享 IP 孵化工作台**。

它不应该被设计成「又一个 AI 聊天写小说工具」，而应成为作者长期维护作品资产、检查设定一致性、沉淀世界观、测试角色声音、形成投稿与宣发材料的创作系统。

## 1. 产品背景与机会

当前 AI 写作产品已经非常多，单纯「输入一句话，AI 生成一段正文」很难形成差异化，也容易触发创作者对 AI 味、同质化和 AI slop 的反感。

更有价值的方向是：

- 帮作者管理复杂设定，而不是替作者忘掉设定。
- 帮作者发现前后矛盾，而不是生成更多不可控文本。
- 帮作者保持原创文风，而不是把所有作品磨成同一种 AI 语气。
- 帮作者把作品资产转化为企划案、角色卡、宣传文案和可分享页面。
- 帮作者形成可复用模板和社区化内容，降低新项目启动成本。

因此，本项目应围绕「可展示、可传播、可复用、可社区化」四个关键词演进。

## 2. 目标用户

### 2.1 核心用户

- 网文作者：需要管理长篇连载设定、角色、伏笔、爽点节奏和章节进度。
- 独立小说作者：需要维护世界观、人物弧光、时间线和投稿材料。
- 剧本/短剧创作者：需要快速形成角色关系、分集大纲、冲突设计和宣发脚本。
- TRPG DM / 世界观创作者：需要管理地点、势力、事件、规则和角色关系。

### 2.2 用户痛点

- 角色设定、称谓、能力、动机前后不一致。
- 时间线、伏笔、世界规则随着章节推进逐渐失控。
- AI 生成内容太像模板，削弱作者个人风格。
- 灵感分散在聊天记录、文档、便签和大纲里，难以结构化复用。
- 作品对外展示成本高，投稿 pitch、角色卡和宣传文案需要重复整理。

## 3. 当前项目状态

### 3.1 已有能力

- 项目管理。
- 会话管理。
- 消息记录。
- 项目记忆。
- 知识库与文档上传。
- RAG 检索。
- AI 对话。
- Story Bible 结构化条目。
- 剧情一致性检查基础能力。

### 3.2 当前技术栈

- 前端：React 18、TypeScript、Vite。
- 后端：FastAPI、SQLAlchemy、SQLite。
- AI/RAG：AI service、RAG service、ChromaDB / embedding 相关能力。

### 3.3 关键目录

- 后端入口：`app/backend/app/main.py`
- 后端模型：`app/backend/app/models/models.py`
- 后端 schema：`app/backend/app/schemas/schemas.py`
- 后端 API：`app/backend/app/api/`
- 后端服务：`app/backend/app/services/`
- 前端入口：`app/frontend/src/App.tsx`
- 前端 API 客户端：`app/frontend/src/services/api.ts`
- 前端类型：`app/frontend/src/types/index.ts`

## 4. 产品原则

1. **作者主权优先**：AI 只提供建议、提取、检查和辅助改写，关键设定必须可编辑、可锁定、可删除。
2. **结构化优先**：重要资产不应只留在聊天文本里，应沉淀为 Story Bible、记忆、章节、图谱、时间线、模板等结构化数据。
3. **连续性优先**：长篇创作最重要的是不崩设定。聊天、改写、检查、企划案都应优先引用已确认设定。
4. **可传播优先**：每个阶段都尽量产出能截图、复制、导出或分享的成果。
5. **隐私优先**：未公开稿件和商业稿件默认敏感；多模型和本地模型模式应明确数据去向。
6. **可渐进实现**：允许先在 `App.tsx` 中集成 MVP，但稳定后应拆分组件和服务。

## 5. 信息架构

建议最终形成以下主导航或工作区：

- 项目首页：项目概览、最近会话、近期资产、写作进度。
- 聊天工作台：带 RAG、记忆和 Story Bible 上下文的 AI 对话。
- 故事圣经：人物、世界规则、地点、势力、时间线、剧情线、伏笔、主题、文风规则。
- 一致性检查：粘贴文本或章节，一键扫描矛盾和风险。
- 角色访谈：选择人物记忆，让 AI 以角色身份回答问题。
- 图谱与时间线：关系图、势力图、事件时间线。
- 文风 DNA：上传样本文本，生成文风规则并用于改写/续写。
- 企划案与分享：生成 logline、简介、卖点、角色卡、封面提示词和社媒文案。
- 模板库：使用预设模板或把项目导出为模板。
- 章节工作流：卷、章、场景、大纲、草稿、修订、最终稿。
- 设置：模型 Provider、API Key、本地模型、隐私模式。

## 6. 功能规格与路线图

### P0. Story Bible 自动生成和维护（已实现，继续增强）

#### 目标

从项目记忆、会话消息、知识库文档中自动生成结构化设定集，让用户一键得到「我的小说设定集」。

#### 数据结构

`StoryBibleEntry` 建议字段：

- `id`
- `project_id`
- `category`
- `title`
- `content`
- `source_type`
- `source_id`
- `created_at`
- `updated_at`
- 后续可扩展：`locked`、`confidence`、`tags`、`version`。

分类：

- `character`
- `world_rule`
- `location`
- `faction`
- `timeline`
- `plot_thread`
- `foreshadowing`
- `theme`
- `style_rule`
- `note`

#### API

- `GET /api/projects/{project_id}/story-bible`
- `POST /api/projects/{project_id}/story-bible`
- `POST /api/projects/{project_id}/story-bible/generate`
- `PUT /api/story-bible/{entry_id}`
- `DELETE /api/story-bible/{entry_id}`

#### 后续增强

- 支持条目锁定：AI 生成时不得覆盖锁定条目。
- 支持来源追溯：展示来自哪段会话、哪条记忆、哪个文档。
- 支持增量生成：只处理最近新增内容。
- 支持冲突合并：发现同一人物或地点重复条目时提示用户合并。
- 在聊天 system prompt 中优先注入 Story Bible 条目。

#### 验收标准

- 用户可按分类查看、编辑、删除 Story Bible 条目。
- 用户可从当前项目生成结构化条目。
- AI 聊天能优先遵守 Story Bible 中已确认设定。

### P1. 剧情一致性检查器（已实现基础版，继续增强）

#### 目标

扫描当前章节、会话内容或粘贴文本，找出与项目记忆、Story Bible、知识库之间的矛盾。

#### API

- `POST /api/projects/{project_id}/consistency-check`

请求体：

- `text`
- `scope`
- `include_memories`
- `include_story_bible`
- `include_knowledge_base`

响应 issue 字段：

- `severity`: `low` / `medium` / `high`
- `type`: `character` / `timeline` / `world_rule` / `plot` / `style`
- `issue`
- `evidence`
- `suggestion`

#### 后续增强

- 接入 RAG：根据待检查文本检索相关知识库片段。
- 支持章节级检查：直接检查 Chapter content。
- 支持「只检查高风险问题」开关。
- 支持把修复建议转为待办任务或修订批注。
- 支持点击证据跳转到 Story Bible/记忆/知识库来源。

#### 验收标准

- 用户能粘贴文本并得到结构化问题列表。
- 每个问题都有严重程度、类型、证据和建议。
- 检查结果不直接覆盖原文，必须由用户确认。

### P2. 前端知识库文档管理增强

#### 目标

让作者更清楚地管理上传过的资料、旧稿和参考文档。

#### 能力

- 展示知识库中的文档列表。
- 显示文件名、上传时间、切片数量、处理状态。
- 支持删除文档。
- 支持对单个知识库执行检索测试。
- 在 Story Bible 生成和一致性检查中可选择是否使用知识库。

#### 验收标准

- 用户知道哪些资料已经被系统吸收。
- 用户可以删除错误或过期资料。
- 用户可以验证某段设定能否被 RAG 找到。

### P3. 角色访谈 / 角色扮演模拟器

#### 目标

基于 `Memory` 中的 `character` 类型，让 AI 固定以某个角色身份回答问题，帮助作者测试人物声音和性格稳定性。

#### 建议路径

- `app/backend/app/api/character_chat.py`
- `app/backend/app/services/character_service.py`
- `app/frontend/src/components/CharacterInterview.tsx`

#### API

- `POST /api/projects/{project_id}/characters/{memory_id}/interview`

请求体：

- `question`
- `conversation_history`

响应：

- `answer`
- `voice_notes`
- `possible_new_memory`

#### Prompt 要求

- AI 必须以该角色身份回答。
- 不得跳出角色解释「我是 AI」。
- 未定义设定应保持克制，可以提出「可能的新设定」供作者确认。
- 回答风格应参考 Story Bible 和文风规则。

#### 前端体验

- 在人物记忆卡片上增加「访谈」按钮。
- 支持常用问题模板：恐惧、欲望、秘密、背叛、关系评价、关键场景回忆。
- 支持将访谈中出现的新设定保存为项目记忆或 Story Bible 条目。

### P4. 小说企划案 / 投稿包 / 分享页

#### 目标

把项目资产整理成对外展示材料，提升作品传播和投稿效率。

#### 建议路径

- `app/backend/app/api/pitch.py`
- `app/backend/app/services/pitch_service.py`
- `app/frontend/src/components/PitchGenerator.tsx`
- 可选：`app/frontend/src/pages/SharePage.tsx`

#### API

- `POST /api/projects/{project_id}/pitch/generate`

结构化输出：

- `logline`
- `synopsis`
- `selling_points`
- `main_characters`
- `world_summary`
- `volume_outline`
- `target_audience`
- `social_posts`
- `cover_prompt`

#### 前端能力

- 企划案预览。
- 复制 Markdown。
- 导出 Markdown / PDF。
- 后续支持只读分享链接。

### P5. 章节、场景和修订工作流

#### 目标

把项目从聊天型工具升级为完整写作工作台。

#### 建议路径

- `app/backend/app/api/chapters.py`
- `app/backend/app/services/chapter_service.py`
- `app/frontend/src/components/ChapterList.tsx`
- `app/frontend/src/components/EditorPanel.tsx`

#### 数据结构

`Chapter`：

- `id`
- `project_id`
- `title`
- `summary`
- `content`
- `status`: `outline` / `draft` / `revising` / `done`
- `order_index`
- `created_at`
- `updated_at`

`Scene`：

- `id`
- `chapter_id`
- `title`
- `summary`
- `content`
- `order_index`

#### API

- `GET /api/projects/{project_id}/chapters`
- `POST /api/projects/{project_id}/chapters`
- `PUT /api/chapters/{chapter_id}`
- `DELETE /api/chapters/{chapter_id}`
- `POST /api/chapters/{chapter_id}/revise`

#### 后续联动

- 章节编辑器中接入一致性检查。
- 章节编辑器中接入文风 DNA 改写。
- 从章节自动提取 Story Bible 增量。
- 根据章节状态统计写作进度。

### P6. 创作模板库和模板分享机制

#### 目标

让新用户从高质量模板快速开始，也让用户能把自己的设定结构导出为模板，形成社区增长机制。

#### 建议路径

- `app/backend/app/api/templates.py`
- `app/frontend/src/components/TemplateGallery.tsx`
- `app/frontend/src/components/TemplateDetail.tsx`

#### 数据结构

`ProjectTemplate`：

- `id`
- `name`
- `description`
- `genre`
- `template_data`
- `is_public`
- `created_at`

`template_data` 可包含：

- 初始记忆。
- Story Bible 分类字段。
- 角色字段。
- 世界观字段。
- 剧情结构。

#### API

- `GET /api/templates`
- `POST /api/templates`
- `POST /api/templates/{template_id}/create-project`
- `POST /api/projects/{project_id}/export-template`

#### 内置模板建议

- 玄幻升级流。
- 悬疑推理。
- 都市异能。
- 恋爱群像。
- 科幻探索。
- 无限流副本。
- 仙侠宗门。
- 短剧爽点。

### P7. 作者风格 DNA / 文风锁定

#### 目标

让作者上传自己的作品片段，系统分析文风并在后续润色、改写、生成时保持个人风格。

#### 建议路径

- `app/backend/app/api/style.py`
- `app/backend/app/services/style_service.py`
- `app/frontend/src/components/AuthorStylePanel.tsx`

#### 数据结构

`AuthorStyleProfile`：

- `id`
- `project_id`
- `name`
- `sample_text`
- `style_summary`
- `rules_json`
- `created_at`
- `updated_at`

#### API

- `POST /api/projects/{project_id}/style-profiles`
- `GET /api/projects/{project_id}/style-profiles`
- `POST /api/style-profiles/{style_id}/rewrite`

#### 分析维度

- 句长偏好。
- 叙述视角。
- 对话比例。
- 情绪密度。
- 常用修辞。
- 节奏特点。
- 禁用风格。
- 示例改写规则。

#### 限制

- 不要承诺模仿在世作者。
- 应描述项目作者自己的样本文风。
- 文风规则应可启用/关闭。

### P8. 多模型 Provider 和本地模型隐私模式

#### 目标

支持 OpenAI、Claude、Gemini、DeepSeek、本地 Ollama 等多模型配置，满足技术社区和隐私敏感作者需求。

#### 建议路径

- `app/backend/app/services/ai_service.py`
- `app/backend/app/core/config.py`
- `app/backend/app/api/settings.py`
- `app/frontend/src/components/SettingsPanel.tsx`

#### 设计

配置项：

- `ai_provider`
- `openai_api_key`
- `openai_api_base`
- `ollama_base_url`
- `default_model`
- 后续：`anthropic_api_key`、`gemini_api_key`、`deepseek_api_key`

Provider 适配层：

- `OpenAIProvider`
- `OllamaProvider`
- 后续：`AnthropicProvider`、`GeminiProvider`、`DeepSeekProvider`

#### API

- `GET /api/settings/models`
- `POST /api/settings/models/test`

#### 前端要求

- 设置页允许选择 Provider、模型、base URL。
- 本地模型模式明确显示「内容不发送到云端模型」。
- 云端模型模式明确显示数据会发送给对应服务商。

### P9. 内容传播助手

#### 目标

把小说设定转化为社媒内容和宣传素材，让用户天然愿意分享产品输出。

#### 建议路径

- `app/backend/app/api/promotion.py`
- `app/backend/app/services/promotion_service.py`
- `app/frontend/src/components/PromotionPanel.tsx`

#### API

- `POST /api/projects/{project_id}/promotion/generate`

请求体：

- `platform`: `xiaohongshu` / `weibo` / `douyin` / `bilibili` / `twitter`
- `content_type`
- `tone`
- `target_reader`

内容类型：

- 角色卡文案。
- 章节预告。
- 世界观介绍。
- 短视频脚本。
- 互动问题。
- 投稿简介。

#### 前端能力

- 一键复制。
- 重新生成。
- 保存到项目资产库。
- 后续生成角色卡海报图或封面提示词。

### P10. 关系图谱 + 时间线可视化

#### 目标

把人物关系、势力关系、地点和事件因果链可视化，让作品资产更适合截图和传播。

#### 建议路径

- `app/backend/app/api/graph.py`
- `app/backend/app/services/graph_service.py`
- `app/frontend/src/components/StoryGraph.tsx`
- `app/frontend/src/components/TimelineView.tsx`

#### 数据结构

`StoryNode`：

- `id`
- `project_id`
- `type`
- `label`
- `description`
- `source_id`

`StoryEdge`：

- `id`
- `project_id`
- `source_node_id`
- `target_node_id`
- `relation_type`
- `description`

`TimelineEvent`：

- `id`
- `project_id`
- `title`
- `description`
- `event_order`
- `time_label`
- `related_nodes`

#### API

- `GET /api/projects/{project_id}/graph`
- `POST /api/projects/{project_id}/graph/generate`
- `GET /api/projects/{project_id}/timeline`
- `POST /api/projects/{project_id}/timeline/generate`

#### 实现建议

- MVP 可用简单 SVG 或 HTML/CSS。
- 稳定后可接 React Flow、D3、ECharts 等库。
- 必须支持用户手动编辑，避免完全依赖 AI 自动生成。

## 7. AI 上下文优先级

聊天、检查、改写、企划案等功能应采用一致的上下文策略：

1. 用户当前输入。
2. 锁定或人工确认的 Story Bible 条目。
3. 项目记忆。
4. 相关章节/场景内容。
5. RAG 检索出的知识库片段。
6. 最近会话历史。
7. 通用写作建议。

若上下文冲突：

- 优先相信锁定的 Story Bible。
- 其次相信人工编辑过的记忆。
- AI 自动提取内容应标记为低优先级或待确认。
- 应向用户指出冲突，而不是静默覆盖。

## 8. 后端开发规范

- Route 只负责 HTTP 层，不写复杂 prompt。
- Service 负责业务逻辑、AI 调用、RAG 检索和结构化解析。
- Model 和 Schema 同步更新。
- 新增 API 后更新前端类型和 API 客户端。
- 项目级数据必须使用 `project_id` 过滤。
- AI 输出必须尽量使用 JSON schema 或 Pydantic 模型校验。
- 对外错误信息应友好，内部异常不要泄漏 API Key 或完整稿件。

## 9. 前端开发规范

- API 调用统一封装到 `app/frontend/src/services/api.ts`。
- TypeScript 类型统一维护在 `app/frontend/src/types/index.ts`。
- 大组件逐步拆分，不要让 `App.tsx` 无限膨胀。
- 每个新功能至少包含：入口、空状态、加载状态、错误提示、成功反馈。
- 重要结果支持复制或导出。
- 中文 UI 文案应面向作者，而非技术人员。

## 10. 数据与隐私规范

- 小说正文、未公开设定、上传文档、投稿材料默认视为敏感数据。
- 不在日志中打印完整稿件、上传文档全文、API Key。
- 分享页、公开模板、公开角色卡必须明确用户授权。
- 本地模型模式和云端模型模式必须在 UI 中区分。
- 用户应能删除项目资产及其派生数据。

## 11. 推荐迭代顺序

如果目标是最快提升产品完成度和传播性，建议顺序：

1. Story Bible 自动生成器增强。
2. 剧情一致性检查器增强。
3. 前端知识库文档管理增强。
4. 角色访谈模拟器。
5. 小说企划案 / 分享页。
6. 章节工作流。
7. 模板市场。
8. 文风 DNA。
9. 多模型 / 本地模型。
10. 内容传播助手。
11. 关系图谱 / 时间线可视化。

## 12. MVP 里程碑

### Milestone A：设定资产工作台

- Story Bible 可生成、编辑、删除、分类展示。
- 知识库文档可管理。
- 聊天使用 Story Bible 和记忆作为高优先级上下文。

### Milestone B：防崩坏编辑助手

- 一致性检查接入 Story Bible、记忆和知识库。
- 章节草稿可一键检查。
- 检查结果可转为修订待办。

### Milestone C：角色与企划传播

- 角色访谈可用。
- 企划案生成可用。
- 支持复制/导出 Markdown。

### Milestone D：完整写作工作流

- 章节和场景管理。
- 文风 DNA。
- 多模型设置。
- 模板库。

## 13. Definition of Done

每个功能完成时应满足：

- 后端 API 可通过 OpenAPI 文档或 curl 测试。
- 前端有可点击入口和完整状态反馈。
- 数据能持久化并按项目隔离。
- AI 返回结果经过结构化校验。
- 用户可以编辑或撤销 AI 生成的关键资产。
- 基础检查通过：
  - `python -m compileall app/backend/app`
  - `cd frontend && npm run build`
  - `git diff --check`

