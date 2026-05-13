# 📖 AI-Story (AI 小说构思助手)

> **面向小说创作者的 AI 创作资产管理 + 连续性检查 + IP 孵化工作台**

[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green.svg)](https://fastapi.tiangolo.com/)
[![ChromaDB](https://img.shields.io/badge/ChromaDB-RAG-orange.svg)](https://www.trychroma.com/)
[![Python](https://img.shields.io/badge/Python-3.10+-yellow.svg)](https://www.python.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

AI-Story 并非单纯的“套壳对话框”，而是一个专为小说作者打造的**结构化创作辅助系统**。从灵感闪现到大纲推演，从角色设定管理到“吃书”防崩坏审查，甚至未来的作品宣发，AI-Story 致力于成为你创作路上的超级大脑。

无论是网文作者、独立小说家，还是跑团(TRPG) DM，都能在这里构建属于自己的文字世界。

---

## ✨ 核心亮点功能 (Current Features)

* 🧠 **RAG 个人知识库介入 (RAG Knowledge Base)**
    告别 AI 的“鱼的记忆”。上传你的灵感大纲、参考资料或过往废稿，系统采用本地向量化（Sentence-Transformers + ChromaDB），让 AI 助手完美掌握你的专属设定，拒绝“套路化”的通用回复。
* 📚 **智能“故事圣经” (Story Bible)** `🔥New`
    不再需要手动记录零散的设定！系统能自动从你与 AI 的对话中提取“近期剧情讨论摘要”，并映射为人物、世界观、剧情线等结构化数据，自动沉淀并固化你的小说资产。
* 🛡️ **轻量级设定防崩坏审查 (Consistency Check)** `🔥New`
    把刚写完的章节草稿丢进来，系统会自动比对“故事圣经”和“项目记忆”。角色称谓变了？时间线冲突了？AI 会像苛刻的编辑一样为你指出潜在的设定 Bug，防止“吃书”。
* 📂 **结构化记忆管理 (Memories)**
    直观地管理（人物 / 世界观 / 剧情 / 笔记）卡片，建立复杂而庞大的小说专属维基百科。

---

## 🚀 演进路线图 (Roadmap)

我们正在快速迭代，以下是即将到来的杀手级特性：

- [ ] **🔒 极致隐私与多模型支持 (Privacy First & Ollama Integration)**
      重构 AI 服务层，支持一键切换本地开源模型（如 **Ollama**）。无需联网，你的商业稿件、未公开脑洞绝不上传云端，彻底打消隐私顾虑。同时支持 OpenAI/Claude/DeepSeek 等多提供商接入。
- [ ] **📣 IP 内容宣发与孵化工作台 (IP Incubator)**
      不仅帮你写书，还帮你推书！利用现成的“故事圣经”，一键生成：小红书/抖音角色海报文案、短视频分镜脚本、连载预告及读者互动话术。
- [ ] **🕸️ 动态关系图谱可视化 (Dynamic Relationship Graph)**
      将人物卡片与势力设定转化为可视化的交互网状图（基于 D3.js 或 ECharts），直观掌控全书角色羁绊。

---

## 🛠️ 系统架构与技术栈 (Tech Stack)

本项目采用现代化的前后端分离架构：

* **前端 (Frontend)**: 
  * React 18 + TypeScript + Vite 
  * 状态管理与路由配置完善，打造极速的 SPA 体验。
* **后端 (Backend)**: 
  * Python 3.10+ & FastAPI 
  * SQLAlchemy ORM 结合 SQLite（提供极低的部署门槛，并支持平滑迁移至 PostgreSQL）。
* **AI & 数据流 (AI & Data)**: 
  * LangChain 框架
  * ChromaDB 本地向量持久化
  * Sentence-Transformers（轻量级本地 Embedding 方案）。

---

## 📦 快速开始 (Getting Started)

### 前置要求 (Prerequisites)
* [Node.js](https://nodejs.org/) (v16 或更高版本)
* [Python](https://www.python.org/downloads/) (3.10 或更高版本)
* 你的大模型 API Key（目前默认支持 OpenAI，即将支持本地 Ollama）

### 1. 克隆项目
```bash
git clone [https://github.com/HenryLiu0405/AI-Story.git](https://github.com/HenryLiu0405/AI-Story.git)
cd AI-Story
```

### 2. 启动后端服务 (Backend)
```bash
cd backend

# 创建并激活虚拟环境
python -m venv venv
# Windows: venv\Scripts\activate
# macOS/Linux: source venv/bin/activate

# 安装依赖
pip install -r requirements.txt

# 配置环境变量
cp .env.example .env
# ⚠️ 注意: 请打开 .env 文件，填入你的 OPENAI_API_KEY 等配置信息

# 初始化数据库并启动服务
uvicorn app.main:app --reload --port 8000
```

### 3. 启动前端服务 (Frontend)
打开一个新的终端窗口：
```bash
cd frontend
npm install
npm run dev
```
打开浏览器访问 `http://localhost:5173` 即可开始你的创作之旅！

---

## 🎯 核心使用工作流 (Workflow)

为了最大化 AI-Story 的效能，推荐按照以下流程使用：

1. **🏗️ 建立沙盒**：创建一个新的“项目 (Project)”，填写基础描述。
2. **📝 喂养设定**：在“记忆 (Memories)”中添加男女主基础人设；在“知识库”中上传你的旧稿或灵感大纲。
3. **💬 头脑风暴**：进入“会话 (Sessions)”与 AI 开始畅聊。系统会自动结合之前的记忆和知识库给出深度建议。
4. **📥 沉淀圣经**：聊完一个大阶段后，点击生成“故事圣经 (Story Bible)”，系统会自动提取你们刚才讨论出的新设定并保存。
5. **🔍 章节审查**：写完正文后，将文本复制进“一致性审查 (Consistency Check)”，让 AI 帮你扫描是否有设定冲突。

---

## 🤝 参与贡献 (Contributing)

我们非常欢迎社区的力量！如果你有绝妙的 Idea 或发现了 Bug，可以通过以下方式参与：

1. Fork 本仓库
2. 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的修改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 发起一个 Pull Request

如果你有任何关于新奇功能的脑洞，也欢迎随时在 [Discussions] 中与我们交流探讨！
