# AI Novel Companion - AI小说构思助手

## 1. 项目概述

**项目名称**: AI Novel Companion  
**项目类型**: Web应用程序 (前后端分离)  
**核心功能**: 辅助用户进行小说构思、灵感讨论，支持项目管理和RAG知识库增强  
**目标用户**: 小说作者、创意写作爱好者

## 2. 技术栈

- **前端**: React 18 + TypeScript + Vite
- **后端**: Python FastAPI
- **数据库**: SQLite + SQLAlchemy
- **RAG引擎**: ChromaDB (向量数据库)
- **AI接口**: 支持OpenAI/Claude等API (模块化设计)

## 3. 核心功能模块

### 3.1 Project管理
- 创建、编辑、删除Project
- 每个Project独立存储
- Project包含名称、描述、创建时间等元信息

### 3.2 会话管理
- 每个Project可有多个会话 (Session)
- 会话包含对话历史
- 支持会话重命名、删除

### 3.3 共享记忆 (Shared Memory)
- Project级别的记忆存储
- 支持添加、编辑、删除记忆内容
- 记忆内容可被AI在对话中引用
- 记忆类型：
  - 人物设定 (Characters)
  - 世界观/背景设定 (World Settings)
  - 剧情大纲 (Plot Outline)
  - 其他自定义记忆

### 3.4 对话功能
- 与AI进行实时对话
- 支持Markdown格式
- 支持代码块显示
- AI可访问当前Project的共享记忆

### 3.5 RAG外挂知识库
- 上传文档作为知识库
- 支持PDF、TXT、Markdown等格式
- 向量化存储
- 对话时可检索相关知识
- 支持多知识库管理

### 3.6 外部信息引入
- 支持网络搜索（可配置API）
- 支持实时查询天气、时间等信息
- 模块化设计，便于扩展

## 4. 数据模型

### Project
```
- id: UUID
- name: string
- description: string
- created_at: datetime
- updated_at: datetime
```

### Session
```
- id: UUID
- project_id: UUID (FK)
- name: string
- created_at: datetime
- updated_at: datetime
```

### Message
```
- id: UUID
- session_id: UUID (FK)
- role: enum (user/assistant/system)
- content: text
- created_at: datetime
```

### Memory
```
- id: UUID
- project_id: UUID (FK)
- type: enum (character/world/plot/custom)
- title: string
- content: text
- created_at: datetime
- updated_at: datetime
```

### KnowledgeBase
```
- id: UUID
- project_id: UUID (FK)
- name: string
- description: string
- file_path: string
- created_at: datetime
```

### Document
```
- id: UUID
- knowledge_base_id: UUID (FK)
- content: text
- metadata: json
- embedding: vector
- created_at: datetime
```

## 5. API设计

### Projects
- POST /api/projects - 创建Project
- GET /api/projects - 获取所有Project
- GET /api/projects/{id} - 获取单个Project
- PUT /api/projects/{id} - 更新Project
- DELETE /api/projects/{id} - 删除Project

### Sessions
- POST /api/projects/{project_id}/sessions - 创建Session
- GET /api/projects/{project_id}/sessions - 获取所有Session
- GET /api/sessions/{id} - 获取单个Session
- PUT /api/sessions/{id} - 更新Session
- DELETE /api/sessions/{id} - 删除Session

### Messages
- GET /api/sessions/{session_id}/messages - 获取消息历史
- POST /api/sessions/{session_id}/messages - 发送消息
- DELETE /api/sessions/{session_id}/messages - 清空消息

### Memories
- POST /api/projects/{project_id}/memories - 创建记忆
- GET /api/projects/{project_id}/memories - 获取所有记忆
- PUT /api/memories/{id} - 更新记忆
- DELETE /api/memories/{id} - 删除记忆

### Knowledge Base
- POST /api/projects/{project_id}/knowledge-bases - 创建知识库
- GET /api/projects/{project_id}/knowledge-bases - 获取所有知识库
- DELETE /api/knowledge-bases/{id} - 删除知识库
- POST /api/knowledge-bases/{id}/upload - 上传文档
- POST /api/knowledge-bases/{id}/search - 检索知识库

### Chat (AI对话)
- POST /api/chat - 发送消息并获取AI响应

## 6. 前端页面结构

1. **项目列表页** (/projects)
   - 显示所有项目卡片
   - 新建项目按钮

2. **项目详情页** (/projects/:id)
   - 左侧边栏：记忆列表、会话列表、知识库
   - 主内容区：当前会话对话界面

3. **设置页** (/settings)
   - API配置
   - 主题设置

## 7. 交互流程

### 创建小说项目的流程
1. 用户点击"新建项目"
2. 输入项目名称和描述
3. 进入项目后，开始创建/选择会话
4. 在记忆中添加人物设定和世界观
5. 开始与AI对话创作

### RAG使用流程
1. 在项目中创建知识库
2. 上传参考文档
3. 对话时AI自动检索相关知识
4. 将知识融入回复

## 8. 验收标准

- [ ] 可以创建、编辑、删除项目
- [ ] 每个项目可以创建多个会话
- [ ] 可以添加、编辑、删除共享记忆
- [ ] AI对话可以引用项目记忆
- [ ] 可以上传文档并检索
- [ ] 界面美观，操作流畅
- [ ] 所有API正常工作
- [ ] 数据正确存储和读取

## 9. 目录结构

```
d:\Code\
├── frontend/                 # React前端
│   ├── src/
│   │   ├── components/       # React组件
│   │   ├── pages/           # 页面组件
│   │   ├── services/        # API服务
│   │   ├── stores/          # 状态管理
│   │   ├── types/           # TypeScript类型
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
├── backend/                  # Python后端
│   ├── app/
│   │   ├── api/             # API路由
│   │   ├── models/          # 数据模型
│   │   ├── services/        # 业务逻辑
│   │   ├── rag/             # RAG相关
│   │   ├── core/            # 核心配置
│   │   └── main.py
│   ├── requirements.txt
│   └── .env
└── README.md
```
