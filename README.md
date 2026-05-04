# AI Novel Companion - AI小说构思助手

一个功能强大的AI辅助小说创作平台，帮助作者进行人物设定、世界观搭建、剧情构思和灵感讨论。

## 功能特性

### 📚 项目管理
- 创建、编辑、删除多个小说项目
- 每个项目独立管理创作内容

### 💬 会话管理
- 每个项目支持多个独立会话
- 会话包含完整的对话历史
- 支持会话重命名和删除

### 🧠 共享记忆
- 项目级别的记忆存储
- 支持多种记忆类型：
  - 👤 人物设定
  - 🌍 世界观/背景设定
  - 📖 剧情大纲
  - 📝 自定义记忆
- AI在对话时自动参考记忆内容

### 📚 RAG外挂知识库
- 上传文档作为参考资料
- 向量化存储，支持语义搜索
- 对话时自动检索相关知识
- 支持多个知识库管理

### 🤖 AI对话
- 实时AI对话功能
- Markdown格式支持
- 智能引用项目记忆和知识库

## 技术栈

### 后端
- **框架**: FastAPI
- **数据库**: SQLite + SQLAlchemy
- **向量数据库**: ChromaDB
- **Embedding模型**: sentence-transformers

### 前端
- **框架**: React 18 + TypeScript
- **构建工具**: Vite
- **HTTP客户端**: Axios
- **Markdown渲染**: react-markdown

## 快速开始

### 1. 克隆项目

```bash
cd d:\Code
```

### 2. 设置后端

```bash
cd backend

# 创建虚拟环境
python -m venv venv

# 激活虚拟环境 (Windows)
venv\Scripts\activate

# 安装依赖
pip install -r requirements.txt

# 复制环境配置
copy .env.example .env

# 编辑 .env 文件，填入你的 API Key
# OPENAI_API_KEY=your-api-key-here
```

### 3. 启动后端服务

```bash
cd backend
python -m app.main
```

后端服务将在 http://localhost:8000 启动

### 4. 设置前端

```bash
cd frontend

# 安装依赖
npm install
```

### 5. 启动前端服务

```bash
cd frontend
npm run dev
```

前端应用将在 http://localhost:3000 启动

## 项目结构

```
d:\Code\
├── SPEC.md                 # 项目规范文档
├── README.md               # 项目说明文档
│
├── backend/                # Python FastAPI 后端
│   ├── app/
│   │   ├── api/           # API 路由
│   │   │   ├── projects.py
│   │   │   ├── sessions.py
│   │   │   ├── memories.py
│   │   │   ├── messages.py
│   │   │   ├── knowledge_bases.py
│   │   │   └── chat.py
│   │   ├── core/          # 核心配置
│   │   │   ├── config.py
│   │   │   └── database.py
│   │   ├── models/         # 数据模型
│   │   │   └── models.py
│   │   ├── schemas/        # Pydantic schemas
│   │   │   └── schemas.py
│   │   ├── services/       # 业务逻辑
│   │   │   ├── ai_service.py
│   │   │   └── rag_service.py
│   │   └── main.py        # 应用入口
│   ├── requirements.txt
│   └── .env.example
│
└── frontend/               # React 前端
    ├── src/
    │   ├── components/     # React 组件
    │   ├── context/        # 状态管理
    │   │   └── StoreContext.tsx
    │   ├── services/       # API 服务
    │   │   └── api.ts
    │   ├── types/          # TypeScript 类型
    │   │   └── index.ts
    │   ├── App.tsx         # 主组件
    │   ├── App.css         # 样式
    │   └── main.tsx        # 入口文件
    ├── index.html
    ├── package.json
    ├── tsconfig.json
    └── vite.config.ts
```

## API 文档

启动后端服务后，访问以下地址查看API文档：

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### 主要API端点

#### 项目管理
- `GET /api/projects` - 获取所有项目
- `POST /api/projects` - 创建项目
- `GET /api/projects/{id}` - 获取单个项目
- `PUT /api/projects/{id}` - 更新项目
- `DELETE /api/projects/{id}` - 删除项目

#### 会话管理
- `GET /api/projects/{project_id}/sessions` - 获取项目会话
- `POST /api/projects/{project_id}/sessions` - 创建会话
- `DELETE /api/sessions/{id}` - 删除会话

#### 记忆管理
- `GET /api/projects/{project_id}/memories` - 获取项目记忆
- `POST /api/projects/{project_id}/memories` - 创建记忆
- `PUT /api/memories/{id}` - 更新记忆
- `DELETE /api/memories/{id}` - 删除记忆

#### 知识库
- `GET /api/projects/{project_id}/knowledge-bases` - 获取知识库
- `POST /api/projects/{project_id}/knowledge-bases` - 创建知识库
- `POST /api/knowledge-bases/{id}/upload` - 上传文档

#### 对话
- `POST /api/chat` - 发送消息获取AI回复

## 使用流程

### 1. 创建项目
1. 点击侧边栏的"新建"按钮
2. 输入项目名称和描述
3. 进入项目详情页

### 2. 管理记忆
1. 切换到"记忆"标签
2. 点击"添加记忆"
3. 选择记忆类型（人物/世界观/剧情/自定义）
4. 填写标题和内容
5. AI会在对话中自动参考这些记忆

### 3. 创建会话
1. 切换到"会话"标签
2. 点击"新建会话"
3. 开始与AI对话创作

### 4. 使用知识库
1. 切换到"知识库"标签
2. 创建知识库
3. 上传参考文档
4. AI会检索相关知识辅助创作

## 配置说明

### 环境变量 (.env)

```env
# OpenAI API 配置
OPENAI_API_KEY=your-api-key-here
OPENAI_API_BASE=https://api.openai.com/v1
OPENAI_MODEL=gpt-4

# 数据库
DATABASE_URL=sqlite:///./novel_companion.db

# ChromaDB 向量数据库
CHROMA_PERSIST_DIR=./chroma_db

# 服务器
HOST=0.0.0.0
PORT=8000
```

## 开发说明

### 添加新的记忆类型
在 `backend/app/models/models.py` 中修改 `MemoryType` 枚举。

### 添加新的API端点
在 `backend/app/api/` 目录下添加新的路由文件。

### 修改前端样式
编辑 `frontend/src/App.css` 文件。

## 注意事项

1. 首次运行需要配置 OpenAI API Key
2. 知识库功能需要下载 Embedding 模型（约 90MB）
3. 建议使用 Chrome 或 Firefox 浏览器

## License

MIT License
