import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import toast, { Toaster } from 'react-hot-toast';
import { useStore } from './context/StoreContext';
import { chatApi, knowledgeBasesApi, storyBibleApi, consistencyApi, settingsApi, pitchApi, templatesApi } from './services/api';
import type { AIModelInfo, AIProvider, Chapter, ChapterStatus, ConsistencyIssue, Document, Memory, MemoryType, PitchGenerateResponse, ProjectTemplate, StoryBibleCategory, StoryBibleEntry, TemplateGenre } from './types';
import CharacterInterview from './components/CharacterInterview';
import TemplateGallery from './components/TemplateGallery';
import AuthorStylePanel from './components/AuthorStylePanel';
import PromotionPanel from './components/PromotionPanel';
import './App.css';

const memoryTypeLabels: Record<MemoryType, { label: string; icon: string }> = {
  character: { label: '人物', icon: '👤' },
  world: { label: '世界观', icon: '🌍' },
  plot: { label: '剧情', icon: '📖' },
  custom: { label: '自定义', icon: '📝' },
};

const storyBibleCategoryLabels: Record<StoryBibleCategory, string> = {
  character: '人物',
  world_rule: '世界规则',
  location: '地点',
  faction: '势力',
  timeline: '时间线',
  plot_thread: '剧情线',
  foreshadowing: '伏笔',
  theme: '主题',
  style_rule: '文风规则',
  note: '笔记',
};

function App() {
  const {
    projects,
    currentProject,
    currentSession,
    sessions,
    memories,
    knowledgeBases,
    messages,
    chapters,
    loadProjects,
    createProject,
    deleteProject,
    selectProject,
    createSession,
    selectSession,
    deleteSession,
    createMemory,
    updateMemory,
    deleteMemory,
    createKnowledgeBase,
    deleteKnowledgeBase,
    loadMessages,
    loadChapters,
    createChapter,
    updateChapter,
    deleteChapter,
  } = useStore();

  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showNewSessionModal, setShowNewSessionModal] = useState(false);
  const [showNewMemoryModal, setShowNewMemoryModal] = useState(false);
  const [showNewKBModal, setShowNewKBModal] = useState(false);
  const [showEditMemoryModal, setShowEditMemoryModal] = useState(false);
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [showInterviewPanel, setShowInterviewPanel] = useState(false);
  const [interviewMemory, setInterviewMemory] = useState<Memory | null>(null);
  const [sidebarTab, setSidebarTab] = useState<'sessions' | 'memories' | 'knowledge' | 'storyBible' | 'consistency' | 'chapters' | 'pitch' | 'styleProfile' | 'promotion'>('sessions');
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [uploadingKbId, setUploadingKbId] = useState<string | null>(null);
  const [storyBibleEntries, setStoryBibleEntries] = useState<StoryBibleEntry[]>([]);
  const [isGeneratingBible, setIsGeneratingBible] = useState(false);
  const [consistencyText, setConsistencyText] = useState('');
  const [consistencyIssues, setConsistencyIssues] = useState<ConsistencyIssue[]>([]);
  const [isCheckingConsistency, setIsCheckingConsistency] = useState(false);
  const [includeMemories, setIncludeMemories] = useState(true);
  const [includeStoryBible, setIncludeStoryBible] = useState(true);
  const [includeKnowledgeBase, setIncludeKnowledgeBase] = useState(false);
  const [consistencyScope, setConsistencyScope] = useState<string[]>([]);
  const [isGeneratingPitch, setIsGeneratingPitch] = useState(false);
  const [pitchData, setPitchData] = useState<PitchGenerateResponse | null>(null);
  const [expandedKbId, setExpandedKbId] = useState<string | null>(null);
  const [kbDocuments, setKbDocuments] = useState<Record<string, Document[]>>({});
  const [kbSearchQuery, setKbSearchQuery] = useState<Record<string, string>>({});
  const [kbSearchResults, setKbSearchResults] = useState<Record<string, any[]>>({});
  const [kbSearching, setKbSearching] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [newSessionName, setNewSessionName] = useState('');
  const [newMemoryType, setNewMemoryType] = useState<MemoryType>('character');
  const [newMemoryTitle, setNewMemoryTitle] = useState('');
  const [newMemoryContent, setNewMemoryContent] = useState('');
  const [editMemoryType, setEditMemoryType] = useState<MemoryType>('character');
  const [editMemoryTitle, setEditMemoryTitle] = useState('');
  const [editMemoryContent, setEditMemoryContent] = useState('');
  const [newKbName, setNewKbName] = useState('');
  const [newKbDesc, setNewKbDesc] = useState('');

  // Template state
  const [createMode, setCreateMode] = useState<'blank' | 'template'>('blank');
  const [showTemplateGallery, setShowTemplateGallery] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null);
  const [isExportingTemplate, setIsExportingTemplate] = useState(false);
  const [showExportTemplateModal, setShowExportTemplateModal] = useState(false);
  const [exportTemplateName, setExportTemplateName] = useState('');
  const [exportTemplateDesc, setExportTemplateDesc] = useState('');
  const [exportTemplateGenre, setExportTemplateGenre] = useState<TemplateGenre>('xuanhuan');

  // Settings modal state
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsProvider, setSettingsProvider] = useState<AIProvider>('openai');
  const [settingsApiKey, setSettingsApiKey] = useState('');
  const [settingsBaseUrl, setSettingsBaseUrl] = useState('');
  const [settingsModel, setSettingsModel] = useState('');
  const [settingsModels, setSettingsModels] = useState<AIModelInfo[]>([]);
  const [settingsCurrentProvider, setSettingsCurrentProvider] = useState<AIProvider>('openai');
  const [settingsCurrentModel, setSettingsCurrentModel] = useState('');
  const [settingsIsLocal, setSettingsIsLocal] = useState(false);
  const [settingsIsConfigured, setSettingsIsConfigured] = useState(false);
  const [settingsTestResult, setSettingsTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [settingsTesting, setSettingsTesting] = useState(false);

  // Chapter state
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [editChapterTitle, setEditChapterTitle] = useState('');
  const [editChapterSummary, setEditChapterSummary] = useState('');
  const [editChapterContent, setEditChapterContent] = useState('');
  const [editChapterStatus, setEditChapterStatus] = useState<ChapterStatus>('outline');
  const [showNewChapterModal, setShowNewChapterModal] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [isSavingChapter, setIsSavingChapter] = useState(false);
  const [chapterView, setChapterView] = useState<'list' | 'editor'>('list');

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!currentProject) {
      setStoryBibleEntries([]);
      setConsistencyIssues([]);
      return;
    }

    storyBibleApi.getByProject(currentProject.id)
      .then(setStoryBibleEntries)
      .catch(() => toast.error('加载故事圣经失败'));
  }, [currentProject]);

  const handleCreateProject = async () => {
    if (createMode === 'template' && selectedTemplate) {
      // Create from template
      try {
        const project = await templatesApi.createProject(selectedTemplate.id, {
          name_override: newProjectName.trim() || undefined,
        });
        setShowNewProjectModal(false);
        setNewProjectName('');
        setNewProjectDesc('');
        setSelectedTemplate(null);
        setCreateMode('blank');
        // Reload projects list and select the new project
        await loadProjects();
        selectProject(project);
        toast.success('项目创建成功');
      } catch {
        toast.error('从模板创建项目失败');
      }
      return;
    }

    if (!newProjectName.trim()) {
      toast.error('请输入项目名称');
      return;
    }
    try {
      const project = await createProject(newProjectName, newProjectDesc);
      setShowNewProjectModal(false);
      setNewProjectName('');
      setNewProjectDesc('');
      selectProject(project);
      toast.success('项目创建成功');
    } catch {
      toast.error('创建项目失败');
    }
  };

  const handleSelectTemplate = (template: ProjectTemplate) => {
    setSelectedTemplate(template);
    setNewProjectName(template.name);
    setShowTemplateGallery(false);
  };

  const handleExportTemplate = async () => {
    if (!currentProject) return;
    if (!exportTemplateName.trim()) {
      toast.error('请输入模板名称');
      return;
    }
    setIsExportingTemplate(true);
    try {
      await templatesApi.exportProject(currentProject.id, {
        name: exportTemplateName,
        description: exportTemplateDesc,
        genre: exportTemplateGenre,
        is_public: false,
      });
      setShowExportTemplateModal(false);
      setExportTemplateName('');
      setExportTemplateDesc('');
      toast.success('模板导出成功');
    } catch {
      toast.error('导出模板失败');
    } finally {
      setIsExportingTemplate(false);
    }
  };

  const handleDeleteProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('确定要删除这个项目吗？')) {
      try {
        await deleteProject(id);
        toast.success('项目已删除');
      } catch {
        toast.error('删除失败');
      }
    }
  };

  const handleCreateSession = async () => {
    if (!currentProject) return;
    try {
      const session = await createSession(currentProject.id, newSessionName || undefined);
      setShowNewSessionModal(false);
      setNewSessionName('');
      selectSession(session);
      toast.success('会话创建成功');
    } catch {
      toast.error('创建会话失败');
    }
  };

  const handleDeleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('确定要删除这个会话吗？')) {
      try {
        await deleteSession(id);
        toast.success('会话已删除');
      } catch {
        toast.error('删除失败');
      }
    }
  };

  const handleCreateMemory = async () => {
    if (!currentProject) return;
    if (!newMemoryTitle.trim()) {
      toast.error('请输入记忆标题');
      return;
    }
    try {
      await createMemory(currentProject.id, newMemoryType, newMemoryTitle, newMemoryContent);
      setShowNewMemoryModal(false);
      setNewMemoryType('character');
      setNewMemoryTitle('');
      setNewMemoryContent('');
      toast.success('记忆创建成功');
    } catch {
      toast.error('创建记忆失败');
    }
  };

  const handleEditMemory = async () => {
    if (!selectedMemory) return;
    try {
      await updateMemory(selectedMemory.id, editMemoryType, editMemoryTitle, editMemoryContent);
      setShowEditMemoryModal(false);
      setSelectedMemory(null);
      toast.success('记忆更新成功');
    } catch {
      toast.error('更新记忆失败');
    }
  };

  const openEditMemory = (memory: Memory) => {
    setSelectedMemory(memory);
    setEditMemoryType(memory.type);
    setEditMemoryTitle(memory.title);
    setEditMemoryContent(memory.content);
    setShowEditMemoryModal(true);
  };

  const handleDeleteMemory = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('确定要删除这条记忆吗？')) {
      try {
        await deleteMemory(id);
        toast.success('记忆已删除');
      } catch {
        toast.error('删除失败');
      }
    }
  };

  const handleCreateKB = async () => {
    if (!currentProject) return;
    if (!newKbName.trim()) {
      toast.error('请输入知识库名称');
      return;
    }
    try {
      await createKnowledgeBase(currentProject.id, newKbName, newKbDesc);
      setShowNewKBModal(false);
      setNewKbName('');
      setNewKbDesc('');
      toast.success('知识库创建成功');
    } catch {
      toast.error('创建知识库失败');
    }
  };


  const handleUploadDocument = async (kbId: string, file: File | null) => {
    if (!file) return;

    setUploadingKbId(kbId);
    try {
      await knowledgeBasesApi.uploadDocument(kbId, file);
      toast.success('文档上传并索引成功');
    } catch {
      toast.error('文档上传或索引失败');
    } finally {
      setUploadingKbId(null);
    }
  };

  const handleDeleteKB = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('确定要删除这个知识库吗？')) {
      try {
        await deleteKnowledgeBase(id);
        toast.success('知识库已删除');
      } catch {
        toast.error('删除失败');
      }
    }
  };

  const handleToggleKbExpand = async (kbId: string) => {
    if (expandedKbId === kbId) {
      setExpandedKbId(null);
      return;
    }
    setExpandedKbId(kbId);
    // Load documents if not already loaded
    if (!kbDocuments[kbId]) {
      try {
        const docs = await knowledgeBasesApi.getDocuments(kbId);
        setKbDocuments(prev => ({ ...prev, [kbId]: docs }));
      } catch {
        toast.error('加载文档列表失败');
      }
    }
  };

  const handleDeleteDocument = async (kbId: string, docId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('确定要删除这个文档吗？')) return;
    try {
      await knowledgeBasesApi.deleteDocument(kbId, docId);
      setKbDocuments(prev => ({
        ...prev,
        [kbId]: (prev[kbId] || []).filter(d => d.id !== docId),
      }));
      toast.success('文档已删除');
    } catch {
      toast.error('删除文档失败');
    }
  };

  const handleSearchKb = async (kbId: string) => {
    const query = kbSearchQuery[kbId]?.trim();
    if (!query) {
      toast.error('请输入检索关键词');
      return;
    }
    setKbSearching(prev => ({ ...prev, [kbId]: true }));
    try {
      const result = await knowledgeBasesApi.searchDocuments(kbId, { query });
      setKbSearchResults(prev => ({ ...prev, [kbId]: result.results }));
    } catch {
      toast.error('检索失败');
    } finally {
      setKbSearching(prev => ({ ...prev, [kbId]: false }));
    }
  };


  const handleGenerateStoryBible = async () => {
    if (!currentProject) return;

    setIsGeneratingBible(true);
    try {
      const result = await storyBibleApi.generate(currentProject.id);
      const entries = await storyBibleApi.getByProject(currentProject.id);
      setStoryBibleEntries(entries);
      toast.success(`已生成 ${result.created_count} 条故事圣经条目`);
    } catch {
      toast.error('生成故事圣经失败');
    } finally {
      setIsGeneratingBible(false);
    }
  };

  const handleDeleteStoryBibleEntry = async (id: string) => {
    if (!confirm('确定要删除这条故事圣经条目吗？')) return;

    try {
      await storyBibleApi.delete(id);
      setStoryBibleEntries(prev => prev.filter(entry => entry.id !== id));
      toast.success('故事圣经条目已删除');
    } catch {
      toast.error('删除故事圣经条目失败');
    }
  };

  const handleToggleLock = async (entry: StoryBibleEntry, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const updated = await storyBibleApi.update(entry.id, { locked: !entry.locked });
      setStoryBibleEntries(prev =>
        prev.map(e => e.id === entry.id ? { ...e, locked: updated.locked, confidence: updated.confidence } : e)
      );
      toast.success(updated.locked ? '条目已锁定' : '条目已解锁');
    } catch {
      toast.error('更新锁定状态失败');
    }
  };

  const handleConsistencyCheck = async () => {
    if (!currentProject) return;
    if (!consistencyText.trim()) {
      toast.error('请先粘贴要检查的剧情或正文');
      return;
    }

    setIsCheckingConsistency(true);
    try {
      const result = await consistencyApi.check(currentProject.id, {
        text: consistencyText,
        include_memories: includeMemories,
        include_story_bible: includeStoryBible,
        include_knowledge_base: includeKnowledgeBase,
        scope: consistencyScope.length > 0 ? consistencyScope : undefined,
      });
      setConsistencyIssues(result.issues);
      toast.success('一致性检查完成');
    } catch {
      toast.error('一致性检查失败');
    } finally {
      setIsCheckingConsistency(false);
    }
  };

  const handleGeneratePitch = async () => {
    if (!currentProject) return;
    setIsGeneratingPitch(true);
    try {
      const result = await pitchApi.generate(currentProject.id);
      setPitchData(result);
      toast.success('企划案生成完成');
    } catch {
      toast.error('企划案生成失败，请检查 AI 服务配置');
    } finally {
      setIsGeneratingPitch(false);
    }
  };

  const handleCopyPitchMarkdown = () => {
    if (!pitchData) return;
    const projectName = currentProject?.name || '未命名项目';
    const md = [
      `# 📋 企划案：《${projectName}》`,
      '',
      '## 一句话梗概',
      pitchData.logline || '（暂无）',
      '',
      '## 故事简介',
      pitchData.synopsis || '（暂无）',
      '',
      '## 卖点',
      ...(pitchData.selling_points?.length
        ? pitchData.selling_points.map((s: string) => `- ${s}`)
        : ['- （暂无）']),
      '',
      '## 主要角色',
      ...(pitchData.main_characters?.length
        ? pitchData.main_characters.map(
            (c: { name: string; role: string; description: string }) =>
              `- **${c.name}**（${c.role}）：${c.description}`
          )
        : ['- （暂无）']),
      '',
      '## 世界观摘要',
      pitchData.world_summary || '（暂无）',
      '',
      '## 目标读者',
      pitchData.target_audience || '（暂无）',
      '',
      '## 封面/海报提示词',
      '```',
      pitchData.cover_prompt || '（暂无）',
      '```',
      '',
      '## 社媒宣传文案',
      ...(pitchData.social_posts?.length
        ? pitchData.social_posts.map((s: string) => `- ${s}`)
        : ['- （暂无）']),
    ].join('\n');

    navigator.clipboard.writeText(md).then(
      () => toast.success('企划案 Markdown 已复制到剪贴板'),
      () => toast.error('复制失败，请手动复制')
    );
  };

  // Settings handlers
  const handleOpenSettings = async () => {
    try {
      const [modelsRes, statusRes] = await Promise.all([
        settingsApi.getModels(),
        settingsApi.getProviderStatus(),
      ]);
      setSettingsModels(modelsRes.models);
      setSettingsCurrentProvider(modelsRes.current_provider);
      setSettingsCurrentModel(modelsRes.current_model);
      setSettingsProvider(modelsRes.current_provider);
      setSettingsModel(modelsRes.current_model);
      setSettingsIsLocal(statusRes.is_local);
      setSettingsIsConfigured(statusRes.is_configured);

      // Pre-fill default URLs for the current provider
      if (modelsRes.current_provider === 'ollama') {
        setSettingsBaseUrl('http://localhost:11434/v1');
        setSettingsApiKey('');
      } else if (modelsRes.current_provider === 'deepseek') {
        setSettingsBaseUrl('https://api.deepseek.com/v1');
        setSettingsApiKey('');
      } else {
        setSettingsBaseUrl('https://api.openai.com/v1');
        setSettingsApiKey('');
      }
      setSettingsTestResult(null);
    } catch {
      toast.error('加载设置失败');
      return;
    }
    setShowSettingsModal(true);
  };

  const handleProviderChange = (provider: AIProvider) => {
    setSettingsProvider(provider);
    setSettingsTestResult(null);
    if (provider === 'ollama') {
      setSettingsBaseUrl('http://localhost:11434/v1');
      setSettingsApiKey('');
    } else if (provider === 'deepseek') {
      setSettingsBaseUrl('https://api.deepseek.com/v1');
      setSettingsApiKey('');
    } else {
      setSettingsBaseUrl('https://api.openai.com/v1');
      setSettingsApiKey('');
    }
  };

  const handleTestConnection = async () => {
    if (!settingsApiKey.trim() && settingsProvider !== 'ollama') {
      toast.error('请输入 API Key');
      return;
    }
    setSettingsTesting(true);
    setSettingsTestResult(null);
    try {
      const result = await settingsApi.testConnection({
        provider: settingsProvider,
        api_key: settingsApiKey,
        base_url: settingsBaseUrl,
        model: settingsModel,
      });
      setSettingsTestResult(result);
    } catch {
      setSettingsTestResult({ success: false, message: '请求失败，请检查网络连接' });
    } finally {
      setSettingsTesting(false);
    }
  };

  // Chapter handlers
  const handleSelectChapter = (chapter: Chapter) => {
    setSelectedChapter(chapter);
    setEditChapterTitle(chapter.title);
    setEditChapterSummary(chapter.summary);
    setEditChapterContent(chapter.content);
    setEditChapterStatus(chapter.status);
    setChapterView('editor');
  };

  const handleSaveChapter = async () => {
    if (!selectedChapter || !currentProject) return;
    setIsSavingChapter(true);
    try {
      await updateChapter(selectedChapter.id, {
        title: editChapterTitle,
        summary: editChapterSummary,
        content: editChapterContent,
        status: editChapterStatus,
      });
      toast.success('章节已保存');
    } catch {
      toast.error('保存章节失败');
    } finally {
      setIsSavingChapter(false);
    }
  };

  const handleCreateChapter = async () => {
    if (!currentProject) return;
    if (!newChapterTitle.trim()) {
      toast.error('请输入章节标题');
      return;
    }
    try {
      const chapter = await createChapter(currentProject.id, newChapterTitle);
      setShowNewChapterModal(false);
      setNewChapterTitle('');
      handleSelectChapter(chapter);
      toast.success('章节创建成功');
    } catch {
      toast.error('创建章节失败');
    }
  };

  const handleDeleteChapter = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('确定要删除这个章节吗？')) return;
    try {
      await deleteChapter(id);
      if (selectedChapter?.id === id) {
        setSelectedChapter(null);
        setChapterView('list');
      }
      toast.success('章节已删除');
    } catch {
      toast.error('删除章节失败');
    }
  };

  const handleBackToChapterList = () => {
    setChapterView('list');
    // Reload chapters to get updated word counts
    if (currentProject) {
      loadChapters(currentProject.id);
    }
  };

  const chapterStatusLabel: Record<ChapterStatus, string> = {
    outline: '大纲',
    draft: '草稿',
    revising: '修改中',
    done: '已完成',
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !currentSession || !currentProject) return;

    const message = inputMessage;
    setInputMessage('');
    setIsSending(true);

    try {
      await chatApi.send({
        session_id: currentSession.id,
        project_id: currentProject.id,
        message,
      });
      // Reload messages
      await loadMessages(currentSession.id);
    } catch {
      toast.error('发送消息失败');
      setInputMessage(message);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="app">
      <Toaster position="top-right" />
      
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1>📚 AI小说助手</h1>
            <button
              className="btn btn-sm btn-secondary"
              onClick={handleOpenSettings}
              title="AI 设置"
              style={{ padding: '6px 8px', fontSize: '1rem' }}
            >
              ⚙️
            </button>
          </div>
        </div>
        <div className="sidebar-content">
          {/* Projects Section */}
          <div className="sidebar-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span className="sidebar-section-title">项目</span>
              <button className="btn btn-sm btn-primary" onClick={() => setShowNewProjectModal(true)}>
                + 新建
              </button>
            </div>
            {projects.map((project) => (
              <div
                key={project.id}
                className={`card ${currentProject?.id === project.id ? 'active' : ''}`}
                onClick={() => selectProject(project)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div className="card-title">{project.name}</div>
                    <div className="card-meta">{formatDate(project.updated_at)}</div>
                  </div>
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={(e) => handleDeleteProject(project.id, e)}
                    style={{ padding: '4px 8px' }}
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
            {projects.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 20 }}>
                暂无项目，点击上方按钮创建
              </div>
            )}
          </div>

          {/* Current Project Sections */}
          {currentProject && (
            <>
              <div className="tabs">
                <button
                  className={`tab ${sidebarTab === 'sessions' ? 'active' : ''}`}
                  onClick={() => setSidebarTab('sessions')}
                >
                  会话
                </button>
                <button
                  className={`tab ${sidebarTab === 'memories' ? 'active' : ''}`}
                  onClick={() => setSidebarTab('memories')}
                >
                  记忆
                </button>
                <button
                  className={`tab ${sidebarTab === 'knowledge' ? 'active' : ''}`}
                  onClick={() => setSidebarTab('knowledge')}
                >
                  知识库
                </button>
                <button
                  className={`tab ${sidebarTab === 'storyBible' ? 'active' : ''}`}
                  onClick={() => setSidebarTab('storyBible')}
                >
                  圣经
                </button>
                <button
                  className={`tab ${sidebarTab === 'consistency' ? 'active' : ''}`}
                  onClick={() => setSidebarTab('consistency')}
                >
                  检查
                </button>
                <button
                  className={`tab ${sidebarTab === 'chapters' ? 'active' : ''}`}
                  onClick={() => setSidebarTab('chapters')}
                >
                  章节
                </button>
                <button
                  className={`tab ${sidebarTab === 'pitch' ? 'active' : ''}`}
                  onClick={() => setSidebarTab('pitch')}
                >
                  📋 企划案
                </button>
                <button
                  className={`tab ${sidebarTab === 'styleProfile' ? 'active' : ''}`}
                  onClick={() => setSidebarTab('styleProfile')}
                >
                  🎨 文风
                </button>
                <button
                  className={`tab ${sidebarTab === 'promotion' ? 'active' : ''}`}
                  onClick={() => setSidebarTab('promotion')}
                >
                  📣 传播
                </button>
              </div>

              {/* Sessions Tab */}
              {sidebarTab === 'sessions' && (
                <div className="sidebar-section">
                  <button className="btn btn-sm btn-secondary btn-block" onClick={() => setShowNewSessionModal(true)}>
                    + 新建会话
                  </button>
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      className={`card ${currentSession?.id === session.id ? 'active' : ''}`}
                      onClick={() => selectSession(session)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div className="card-title">{session.name}</div>
                          <div className="card-meta">{formatDate(session.updated_at)}</div>
                        </div>
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={(e) => handleDeleteSession(session.id, e)}
                          style={{ padding: '4px 8px' }}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Memories Tab */}
              {sidebarTab === 'memories' && (
                <div className="sidebar-section">
                  <button className="btn btn-sm btn-secondary btn-block" onClick={() => setShowNewMemoryModal(true)}>
                    + 添加记忆
                  </button>
                  {memories.map((memory) => (
                    <div
                      key={memory.id}
                      className="memory-item"
                      onClick={() => openEditMemory(memory)}
                    >
                      <span className="memory-icon">{memoryTypeLabels[memory.type].icon}</span>
                      <div className="memory-content">
                        <div className="memory-title">{memory.title}</div>
                        <div className="memory-type">{memoryTypeLabels[memory.type].label}</div>
                      </div>
                      {memory.type === 'character' && (
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            setInterviewMemory(memory);
                            setShowInterviewPanel(true);
                          }}
                          style={{ padding: '4px 8px', fontSize: '0.7rem', marginRight: 4 }}
                          title="角色访谈"
                        >
                          🎭
                        </button>
                      )}
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={(e) => handleDeleteMemory(memory.id, e)}
                        style={{ padding: '4px 8px' }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Knowledge Base Tab */}
              {sidebarTab === 'knowledge' && (
                <div className="sidebar-section">
                  <button className="btn btn-sm btn-secondary btn-block" onClick={() => setShowNewKBModal(true)}>
                    + 创建知识库
                  </button>
                  {knowledgeBases.map((kb) => (
                    <div key={kb.id} className="card">
                      <div
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', cursor: 'pointer' }}
                        onClick={() => handleToggleKbExpand(kb.id)}
                      >
                        <div>
                          <div className="card-title">
                            <span style={{ marginRight: 4 }}>{expandedKbId === kb.id ? '📂' : '📚'}</span>
                            {kb.name}
                          </div>
                          <div className="card-meta">{kb.description || '暂无描述'}</div>
                        </div>
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={(e) => handleDeleteKB(kb.id, e)}
                          style={{ padding: '4px 8px' }}
                        >
                          ×
                        </button>
                      </div>

                      {expandedKbId === kb.id && (
                        <div className="kb-expanded">
                          {/* Upload */}
                          <label className={`upload-control ${uploadingKbId === kb.id ? 'disabled' : ''}`}>
                            <input
                              type="file"
                              accept=".txt,.md,.csv,.json,.log"
                              disabled={uploadingKbId === kb.id}
                              onChange={(e) => {
                                handleUploadDocument(kb.id, e.target.files?.[0] ?? null);
                                e.target.value = '';
                                setTimeout(() => handleToggleKbExpand(kb.id), 500);
                              }}
                            />
                            {uploadingKbId === kb.id ? '索引中...' : '上传文档'}
                          </label>

                          {/* Document List */}
                          <div className="kb-doc-list">
                            <div className="kb-section-title">文档列表 ({(kbDocuments[kb.id] || []).length})</div>
                            {(kbDocuments[kb.id] || []).length === 0 ? (
                              <div className="kb-empty">暂无文档</div>
                            ) : (
                              (kbDocuments[kb.id] || []).map(doc => (
                                <div key={doc.id} className="kb-doc-item">
                                  <span className="kb-doc-name">📄 {doc.filename}</span>
                                  <span className="kb-doc-date">{formatDate(doc.created_at)}</span>
                                  <button
                                    className="btn btn-sm btn-secondary"
                                    onClick={(e) => handleDeleteDocument(kb.id, doc.id, e)}
                                    style={{ padding: '2px 6px', fontSize: '0.65rem' }}
                                  >
                                    ×
                                  </button>
                                </div>
                              ))
                            )}
                          </div>

                          {/* Retrieval Test */}
                          <div className="kb-search-section">
                            <div className="kb-section-title">检索测试</div>
                            <div className="kb-search-row">
                              <input
                                className="form-input kb-search-input"
                                placeholder="输入关键词测试检索..."
                                value={kbSearchQuery[kb.id] || ''}
                                onChange={(e) => setKbSearchQuery(prev => ({ ...prev, [kb.id]: e.target.value }))}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearchKb(kb.id)}
                              />
                              <button
                                className="btn btn-sm btn-primary"
                                onClick={() => handleSearchKb(kb.id)}
                                disabled={kbSearching[kb.id]}
                              >
                                {kbSearching[kb.id] ? '搜索中...' : '搜索'}
                              </button>
                            </div>
                            {(kbSearchResults[kb.id] || []).map((result, idx) => (
                              <div key={idx} className="kb-search-result">
                                <div className="kb-search-score">
                                  相关度: {(result.distance !== undefined ? Math.max(0, (1 - result.distance) * 100) : 0).toFixed(1)}%
                                </div>
                                <div className="kb-search-content">{result.content?.slice(0, 200)}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Story Bible Tab */}
              {sidebarTab === 'storyBible' && (
                <div className="sidebar-section">
                  <button
                    className="btn btn-sm btn-secondary btn-block"
                    onClick={handleGenerateStoryBible}
                    disabled={isGeneratingBible}
                  >
                    {isGeneratingBible ? '生成中...' : '从记忆/会话生成'}
                  </button>
                  {storyBibleEntries.map((entry) => (
                    <div key={entry.id} className={`story-bible-item${entry.locked ? ' locked' : ''}`}>
                      <div className="story-bible-header">
                        <div>
                          <div className="story-bible-title">
                            <span
                              className="lock-toggle"
                              onClick={(e) => handleToggleLock(entry, e)}
                              title={entry.locked ? '点击解锁' : '点击锁定'}
                              style={{ cursor: 'pointer', marginRight: 6, fontSize: 14 }}
                            >
                              {entry.locked ? '🔒' : '🔓'}
                            </span>
                            {entry.title}
                            {entry.confidence < 1.0 && (
                              <span className="confidence-badge" title="AI 置信度">
                                {Math.round(entry.confidence * 100)}%
                              </span>
                            )}
                          </div>
                          <div className="story-bible-category">
                            {storyBibleCategoryLabels[entry.category]}
                            {entry.locked && <span className="locked-label"> · 已锁定</span>}
                          </div>
                        </div>
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => handleDeleteStoryBibleEntry(entry.id)}
                          style={{ padding: '4px 8px' }}
                        >
                          ×
                        </button>
                      </div>
                      <div className="story-bible-content">{entry.content}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Chapters Tab */}
              {sidebarTab === 'chapters' && (
                <div className="sidebar-section">
                  <button className="btn btn-sm btn-secondary btn-block" onClick={() => setShowNewChapterModal(true)}>
                    + 新建章节
                  </button>
                  {chapters
                    .sort((a, b) => a.order_index - b.order_index)
                    .map((chapter) => (
                    <div
                      key={chapter.id}
                      className={`card ${selectedChapter?.id === chapter.id ? 'active' : ''}`}
                      onClick={() => handleSelectChapter(chapter)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div className="card-title">
                            <span style={{ marginRight: 6 }}>
                              {{ outline: '📋', draft: '✍️', revising: '🔧', done: '✅' }[chapter.status]}
                            </span>
                            {chapter.title}
                          </div>
                          <div className="card-meta">
                            {chapterStatusLabel[chapter.status]} · {chapter.word_count} 字
                          </div>
                        </div>
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={(e) => handleDeleteChapter(chapter.id, e)}
                          style={{ padding: '4px 8px' }}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                  {chapters.length === 0 && (
                    <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 20, fontSize: '0.85rem' }}>
                      暂无章节，点击上方按钮创建
                    </div>
                  )}
                </div>
              )}

              {/* Consistency Tab */}
              {sidebarTab === 'consistency' && (
                <div className="sidebar-section">
                  <textarea
                    className="form-textarea consistency-textarea"
                    placeholder="粘贴章节片段、剧情大纲或设定，检查是否与记忆/故事圣经冲突..."
                    value={consistencyText}
                    onChange={(e) => setConsistencyText(e.target.value)}
                  />
                  <div className="consistency-controls">
                    <label className="toggle-label">
                      <input
                        type="checkbox"
                        checked={includeMemories}
                        onChange={(e) => setIncludeMemories(e.target.checked)}
                      />
                      包含记忆
                    </label>
                    <label className="toggle-label">
                      <input
                        type="checkbox"
                        checked={includeStoryBible}
                        onChange={(e) => setIncludeStoryBible(e.target.checked)}
                      />
                      包含故事圣经
                    </label>
                    <label className="toggle-label">
                      <input
                        type="checkbox"
                        checked={includeKnowledgeBase}
                        onChange={(e) => setIncludeKnowledgeBase(e.target.checked)}
                      />
                      包含知识库
                    </label>
                  </div>
                  <div className="scope-selector">
                    <span className="scope-label">限定范围（可选）：</span>
                    <div className="scope-chips">
                      {(['character', 'world_rule', 'timeline', 'plot', 'style'] as const).map(s => (
                        <button
                          key={s}
                          className={`scope-chip ${consistencyScope.includes(s) ? 'active' : ''}`}
                          onClick={() =>
                            setConsistencyScope(prev =>
                              prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
                            )
                          }
                        >
                          {{ character: '人物', world_rule: '世界规则', timeline: '时间线', plot: '剧情', style: '文风' }[s]}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    className="btn btn-sm btn-secondary btn-block"
                    onClick={handleConsistencyCheck}
                    disabled={isCheckingConsistency}
                  >
                    {isCheckingConsistency ? '检查中...' : '检查一致性'}
                  </button>
                  {consistencyIssues.map((issue, index) => (
                    <div key={`${issue.type}-${index}`} className={`consistency-issue severity-${issue.severity}`}>
                      <div className="consistency-issue-title">{issue.issue}</div>
                      <div className="consistency-issue-meta">{issue.type} · {issue.severity}</div>
                      <div className="consistency-issue-body">证据：{issue.evidence}</div>
                      <div className="consistency-issue-body">建议：{issue.suggestion}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Style Profile Tab */}
              {sidebarTab === 'styleProfile' && (
                <AuthorStylePanel projectId={currentProject.id} />
              )}

              {/* Promotion Tab */}
              {sidebarTab === 'promotion' && currentProject && (
                <PromotionPanel
                  projectId={currentProject.id}
                  projectName={currentProject.name}
                />
              )}

              {/* Pitch Tab */}
              {sidebarTab === 'pitch' && (
                <div className="sidebar-section">
                  <button
                    className="btn btn-sm btn-primary btn-block"
                    onClick={handleGeneratePitch}
                    disabled={isGeneratingPitch}
                    style={{ marginBottom: 8 }}
                  >
                    {isGeneratingPitch ? '⏳ 生成中...' : '🚀 生成企划案'}
                  </button>
                  <button
                    className="btn btn-sm btn-secondary btn-block"
                    onClick={() => {
                      setExportTemplateName(currentProject?.name + ' 模板' || '');
                      setExportTemplateDesc(currentProject?.description || '');
                      setShowExportTemplateModal(true);
                    }}
                    style={{ marginBottom: 12 }}
                  >
                    📦 导出为模板
                  </button>

                  {isGeneratingPitch && (
                    <div style={{ textAlign: 'center', padding: 20 }}>
                      <div className="spinner" style={{ margin: '0 auto 12px' }} />
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        AI 正在汇总项目设定，生成投稿材料...
                      </div>
                    </div>
                  )}

                  {!isGeneratingPitch && !pitchData && (
                    <div className="pitch-empty">
                      <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>📋</div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: 4 }}>
                        尚未生成企划案
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                        点击上方按钮，AI 将汇总你的项目记忆、故事圣经、章节和知识库，
                        自动生成投稿用的企划材料。
                      </div>
                    </div>
                  )}

                  {!isGeneratingPitch && pitchData && (
                    <div className="pitch-section">
                      <button
                        className="btn btn-sm btn-secondary btn-block"
                        onClick={handleCopyPitchMarkdown}
                        style={{ marginBottom: 12 }}
                      >
                        📋 一键复制 Markdown
                      </button>

                      {/* Logline */}
                      <div className="pitch-field">
                        <div className="pitch-field-title">🎯 一句话梗概</div>
                        <div className="pitch-field-content pitch-logline">
                          {pitchData.logline || '（暂无）'}
                        </div>
                      </div>

                      {/* Synopsis */}
                      <div className="pitch-field">
                        <div className="pitch-field-title">📖 故事简介</div>
                        <div className="pitch-field-content">
                          {pitchData.synopsis || '（暂无）'}
                        </div>
                      </div>

                      {/* Selling Points */}
                      <div className="pitch-field">
                        <div className="pitch-field-title">✨ 卖点</div>
                        <ul className="pitch-list">
                          {pitchData.selling_points?.length
                            ? pitchData.selling_points.map((s: string, i: number) => (
                                <li key={i}>{s}</li>
                              ))
                            : <li>（暂无）</li>}
                        </ul>
                      </div>

                      {/* Main Characters */}
                      <div className="pitch-field">
                        <div className="pitch-field-title">👥 主要角色</div>
                        {pitchData.main_characters?.length
                          ? pitchData.main_characters.map(
                              (c: { name: string; role: string; description: string }, i: number) => (
                                <div key={i} className="pitch-character-card">
                                  <div className="pitch-character-name">
                                    {c.name}
                                    <span className="pitch-character-role">{c.role}</span>
                                  </div>
                                  <div className="pitch-character-desc">{c.description}</div>
                                </div>
                              )
                            )
                          : <div className="pitch-field-content">（暂无）</div>}
                      </div>

                      {/* World Summary */}
                      <div className="pitch-field">
                        <div className="pitch-field-title">🌍 世界观摘要</div>
                        <div className="pitch-field-content">
                          {pitchData.world_summary || '（暂无）'}
                        </div>
                      </div>

                      {/* Target Audience */}
                      <div className="pitch-field">
                        <div className="pitch-field-title">👀 目标读者</div>
                        <div className="pitch-field-content">
                          {pitchData.target_audience || '（暂无）'}
                        </div>
                      </div>

                      {/* Cover Prompt */}
                      <div className="pitch-field">
                        <div className="pitch-field-title">🎨 封面/海报提示词</div>
                        <div className="pitch-cover-prompt">
                          {pitchData.cover_prompt || '（暂无）'}
                        </div>
                      </div>

                      {/* Social Posts */}
                      <div className="pitch-field">
                        <div className="pitch-field-title">📱 社媒宣传文案</div>
                        <ul className="pitch-list">
                          {pitchData.social_posts?.length
                            ? pitchData.social_posts.map((s: string, i: number) => (
                                <li key={i}>{s}</li>
                              ))
                            : <li>（暂无）</li>}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              )}

            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {selectedChapter && chapterView === 'editor' ? (
          /* Chapter Editor */
          <div className="chat-container">
            <div className="chat-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button className="btn btn-sm btn-secondary" onClick={handleBackToChapterList}>
                  ← 返回
                </button>
                <h2>📝 章节编辑</h2>
              </div>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleSaveChapter}
                disabled={isSavingChapter}
              >
                {isSavingChapter ? '保存中...' : '💾 保存'}
              </button>
            </div>
            <div className="chat-messages" style={{ padding: '24px', overflowY: 'auto' }}>
              {/* Title */}
              <div className="form-group">
                <label className="form-label">章节标题</label>
                <input
                  type="text"
                  className="form-input"
                  value={editChapterTitle}
                  onChange={(e) => setEditChapterTitle(e.target.value)}
                  placeholder="输入章节标题..."
                />
              </div>

              {/* Status & Word Count */}
              <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">状态</label>
                  <select
                    className="form-select"
                    value={editChapterStatus}
                    onChange={(e) => setEditChapterStatus(e.target.value as ChapterStatus)}
                  >
                    <option value="outline">📋 大纲</option>
                    <option value="draft">✍️ 草稿</option>
                    <option value="revising">🔧 修改中</option>
                    <option value="done">✅ 已完成</option>
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">字数统计</label>
                  <div className="form-input" style={{ background: 'var(--bg-color)', display: 'flex', alignItems: 'center' }}>
                    {editChapterContent.length} 字符
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="form-group">
                <label className="form-label">章节摘要</label>
                <textarea
                  className="form-textarea"
                  value={editChapterSummary}
                  onChange={(e) => setEditChapterSummary(e.target.value)}
                  placeholder="简要描述本章内容..."
                  style={{ minHeight: 80 }}
                />
              </div>

              {/* Content */}
              <div className="form-group">
                <label className="form-label">正文内容</label>
                <textarea
                  className="form-textarea"
                  value={editChapterContent}
                  onChange={(e) => setEditChapterContent(e.target.value)}
                  placeholder="开始写作..."
                  style={{ minHeight: 400, fontFamily: 'Georgia, "Noto Serif SC", serif', fontSize: '1rem', lineHeight: 1.8 }}
                />
              </div>

              {/* Consistency check button */}
              <div style={{ marginTop: 8, marginBottom: 24 }}>
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => {
                    setConsistencyText(editChapterContent);
                    setSidebarTab('consistency');
                  }}
                >
                  🔍 检查本章一致性
                </button>
              </div>
            </div>
          </div>
        ) : currentSession ? (
          <div className="chat-container">
            <div className="chat-header">
              <h2>{currentSession.name}</h2>
            </div>
            <div className="chat-messages">
              {messages.map((msg) => (
                <div key={msg.id} className={`message ${msg.role}`}>
                  <div className="message-content">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                  <div className="message-time">{formatDate(msg.created_at)}</div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div className="chat-input-container">
              <div className="chat-input-wrapper">
                <textarea
                  className="chat-input"
                  placeholder="输入你的问题或想法..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isSending}
                  rows={1}
                />
                <button
                  className="btn btn-primary"
                  onClick={handleSendMessage}
                  disabled={isSending || !inputMessage.trim()}
                >
                  {isSending ? '发送中...' : '发送'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="Welcome-screen">
            <div className="welcome-title">欢迎使用 AI小说构思助手</div>
            <div className="welcome-desc">
              你的专属小说创作伙伴，帮助你进行人物设定、世界观搭建、剧情构思和灵感讨论。
            </div>
            {currentProject ? (
              <button className="btn btn-primary" onClick={() => setShowNewSessionModal(true)}>
                开始新会话
              </button>
            ) : (
              <button className="btn btn-primary" onClick={() => setShowNewProjectModal(true)}>
                创建第一个项目
              </button>
            )}
            <div className="welcome-features">
              <div className="feature-card">
                <div className="feature-icon">👤</div>
                <div className="feature-title">人物设定</div>
                <div className="feature-desc">创建和管理角色设定</div>
              </div>
              <div className="feature-card">
                <div className="feature-icon">🌍</div>
                <div className="feature-title">世界观</div>
                <div className="feature-desc">构建独特的故事背景</div>
              </div>
              <div className="feature-card">
                <div className="feature-icon">📖</div>
                <div className="feature-title">剧情构思</div>
                <div className="feature-desc">发展精彩的故事线</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* New Project Modal */}
      {showNewProjectModal && (
        <div className="modal-overlay" onClick={() => { setShowNewProjectModal(false); setCreateMode('blank'); setSelectedTemplate(null); }}>
          <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">新建项目</h3>
              <button className="modal-close" onClick={() => { setShowNewProjectModal(false); setCreateMode('blank'); setSelectedTemplate(null); }}>×</button>
            </div>
            <div className="modal-body">
              {/* Mode switcher */}
              <div className="template-mode-tabs">
                <button
                  className={`template-mode-tab ${createMode === 'blank' ? 'active' : ''}`}
                  onClick={() => { setCreateMode('blank'); setSelectedTemplate(null); }}
                >
                  ✏️ 空白项目
                </button>
                <button
                  className={`template-mode-tab ${createMode === 'template' ? 'active' : ''}`}
                  onClick={() => { setCreateMode('template'); setShowTemplateGallery(true); }}
                >
                  📦 从模板创建
                </button>
              </div>

              {createMode === 'blank' && (
                <>
                  <div className="form-group">
                    <label className="form-label">项目名称</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="例如：玄幻小说构思"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">项目描述（可选）</label>
                    <textarea
                      className="form-textarea"
                      placeholder="描述你的项目..."
                      value={newProjectDesc}
                      onChange={(e) => setNewProjectDesc(e.target.value)}
                    />
                  </div>
                </>
              )}

              {createMode === 'template' && (
                <>
                  {selectedTemplate ? (
                    <>
                      <div className="template-selected-info">
                        <span className="template-genre-badge">
                          {selectedTemplate.genre === 'xuanhuan' && '⚔️ 玄幻升级流'}
                          {selectedTemplate.genre === 'mystery' && '🔍 悬疑推理'}
                          {selectedTemplate.genre === 'urban' && '🏙️ 都市异能'}
                          {selectedTemplate.genre === 'romance' && '💕 恋爱群像'}
                          {selectedTemplate.genre === 'scifi' && '🚀 科幻探索'}
                        </span>
                        <strong>已选模板：{selectedTemplate.name}</strong>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                          {selectedTemplate.description}
                        </p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                          包含 {(selectedTemplate.template_data?.memories?.length || 0)} 条记忆 · {' '}
                          {(selectedTemplate.template_data?.story_bible_entries?.length || 0)} 条故事圣经条目
                        </p>
                        <button
                          className="btn btn-sm btn-secondary"
                          style={{ marginTop: 8 }}
                          onClick={() => { setSelectedTemplate(null); setShowTemplateGallery(true); }}
                        >
                          重新选择模板
                        </button>
                      </div>
                      <div className="form-group">
                        <label className="form-label">项目名称</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="可修改项目名称"
                          value={newProjectName}
                          onChange={(e) => setNewProjectName(e.target.value)}
                        />
                      </div>
                    </>
                  ) : showTemplateGallery ? (
                    <TemplateGallery
                      onSelectTemplate={handleSelectTemplate}
                    />
                  ) : (
                    <div style={{ textAlign: 'center', padding: 30 }}>
                      <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>📦</div>
                      <div style={{ fontSize: '0.875rem', marginBottom: 12 }}>
                        选择一个创作模板快速开始
                      </div>
                      <button
                        className="btn btn-primary"
                        onClick={() => setShowTemplateGallery(true)}
                      >
                        浏览模板库
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => { setShowNewProjectModal(false); setCreateMode('blank'); setSelectedTemplate(null); }}>
                取消
              </button>
              <button
                className="btn btn-primary"
                onClick={handleCreateProject}
                disabled={createMode === 'template' && !selectedTemplate}
              >
                {createMode === 'template' && selectedTemplate ? '从模板创建' : '创建'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Session Modal */}
      {showNewSessionModal && (
        <div className="modal-overlay" onClick={() => setShowNewSessionModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">新建会话</h3>
              <button className="modal-close" onClick={() => setShowNewSessionModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">会话名称（可选）</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="例如：人物讨论"
                  value={newSessionName}
                  onChange={(e) => setNewSessionName(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowNewSessionModal(false)}>
                取消
              </button>
              <button className="btn btn-primary" onClick={handleCreateSession}>
                创建
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Memory Modal */}
      {showNewMemoryModal && (
        <div className="modal-overlay" onClick={() => setShowNewMemoryModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">添加记忆</h3>
              <button className="modal-close" onClick={() => setShowNewMemoryModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">记忆类型</label>
                <select
                  className="form-select"
                  value={newMemoryType}
                  onChange={(e) => setNewMemoryType(e.target.value as MemoryType)}
                >
                  <option value="character">👤 人物设定</option>
                  <option value="world">🌍 世界观</option>
                  <option value="plot">📖 剧情大纲</option>
                  <option value="custom">📝 自定义</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">标题</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="例如：主角张伟"
                  value={newMemoryTitle}
                  onChange={(e) => setNewMemoryTitle(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">内容</label>
                <textarea
                  className="form-textarea"
                  placeholder="详细描述..."
                  value={newMemoryContent}
                  onChange={(e) => setNewMemoryContent(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowNewMemoryModal(false)}>
                取消
              </button>
              <button className="btn btn-primary" onClick={handleCreateMemory}>
                添加
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Memory Modal */}
      {showEditMemoryModal && selectedMemory && (
        <div className="modal-overlay" onClick={() => setShowEditMemoryModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">编辑记忆</h3>
              <button className="modal-close" onClick={() => setShowEditMemoryModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">记忆类型</label>
                <select
                  className="form-select"
                  value={editMemoryType}
                  onChange={(e) => setEditMemoryType(e.target.value as MemoryType)}
                >
                  <option value="character">👤 人物设定</option>
                  <option value="world">🌍 世界观</option>
                  <option value="plot">📖 剧情大纲</option>
                  <option value="custom">📝 自定义</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">标题</label>
                <input
                  type="text"
                  className="form-input"
                  value={editMemoryTitle}
                  onChange={(e) => setEditMemoryTitle(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">内容</label>
                <textarea
                  className="form-textarea"
                  value={editMemoryContent}
                  onChange={(e) => setEditMemoryContent(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowEditMemoryModal(false)}>
                取消
              </button>
              <button className="btn btn-primary" onClick={handleEditMemory}>
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Template Modal */}
      {showExportTemplateModal && (
        <div className="modal-overlay" onClick={() => setShowExportTemplateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">导出为模板</h3>
              <button className="modal-close" onClick={() => setShowExportTemplateModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
                将当前项目的所有记忆和故事圣经条目导出为一个可复用的模板。
              </p>
              <div className="form-group">
                <label className="form-label">模板名称</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="例如：我的玄幻模板"
                  value={exportTemplateName}
                  onChange={(e) => setExportTemplateName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">模板描述（可选）</label>
                <textarea
                  className="form-textarea"
                  placeholder="描述这个模板..."
                  value={exportTemplateDesc}
                  onChange={(e) => setExportTemplateDesc(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">模板类型</label>
                <select
                  className="form-input"
                  value={exportTemplateGenre}
                  onChange={(e) => setExportTemplateGenre(e.target.value as TemplateGenre)}
                >
                  <option value="xuanhuan">⚔️ 玄幻升级流</option>
                  <option value="mystery">🔍 悬疑推理</option>
                  <option value="urban">🏙️ 都市异能</option>
                  <option value="romance">💕 恋爱群像</option>
                  <option value="scifi">🚀 科幻探索</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowExportTemplateModal(false)}>
                取消
              </button>
              <button className="btn btn-primary" onClick={handleExportTemplate} disabled={isExportingTemplate}>
                {isExportingTemplate ? '导出中...' : '导出'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Chapter Modal */}
      {showNewChapterModal && (
        <div className="modal-overlay" onClick={() => setShowNewChapterModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">新建章节</h3>
              <button className="modal-close" onClick={() => setShowNewChapterModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">章节标题</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="例如：第一章 相遇"
                  value={newChapterTitle}
                  onChange={(e) => setNewChapterTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateChapter()}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowNewChapterModal(false)}>
                取消
              </button>
              <button className="btn btn-primary" onClick={handleCreateChapter}>
                创建
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="modal-overlay" onClick={() => setShowSettingsModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <div className="modal-header">
              <h3 className="modal-title">⚙️ AI 模型设置</h3>
              <button className="modal-close" onClick={() => setShowSettingsModal(false)}>×</button>
            </div>
            <div className="modal-body">
              {/* Current status */}
              <div style={{
                padding: '12px',
                borderRadius: 8,
                marginBottom: 16,
                fontSize: '0.85rem',
                background: settingsIsConfigured ? '#ecfdf5' : '#fef3c7',
                border: `1px solid ${settingsIsConfigured ? '#10b981' : '#f59e0b'}`,
              }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>
                  {settingsIsConfigured ? '✅ 已配置' : '⚠️ 未配置'}
                </div>
                <div>
                  当前：{settingsCurrentProvider.toUpperCase()} · {settingsCurrentModel}
                  {settingsIsLocal ? ' 🏠 内容仅在本地模型处理，不上传云端' : ' ☁️ 内容将发送至云端服务器'}
                </div>
              </div>

              {/* Provider select */}
              <div className="form-group">
                <label className="form-label">AI 提供商</label>
                <select
                  className="form-select"
                  value={settingsProvider}
                  onChange={(e) => handleProviderChange(e.target.value as AIProvider)}
                >
                  <option value="openai">OpenAI (GPT-4 / GPT-4o)</option>
                  <option value="deepseek">DeepSeek (DeepSeek-Chat / Reasoner)</option>
                  <option value="ollama">Ollama (本地部署)</option>
                </select>
              </div>

              {/* Model select */}
              <div className="form-group">
                <label className="form-label">模型</label>
                <select
                  className="form-select"
                  value={settingsModel}
                  onChange={(e) => setSettingsModel(e.target.value)}
                >
                  {settingsModels
                    .filter(m => m.provider === settingsProvider)
                    .map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                </select>
              </div>

              {/* Base URL */}
              <div className="form-group">
                <label className="form-label">API 地址</label>
                <input
                  type="text"
                  className="form-input"
                  value={settingsBaseUrl}
                  onChange={(e) => setSettingsBaseUrl(e.target.value)}
                  placeholder={
                    settingsProvider === 'ollama'
                      ? 'http://localhost:11434/v1'
                      : settingsProvider === 'deepseek'
                        ? 'https://api.deepseek.com/v1'
                        : 'https://api.openai.com/v1'
                  }
                />
              </div>

              {/* API Key (hidden for Ollama) */}
              {settingsProvider !== 'ollama' && (
                <div className="form-group">
                  <label className="form-label">API Key</label>
                  <input
                    type="password"
                    className="form-input"
                    value={settingsApiKey}
                    onChange={(e) => setSettingsApiKey(e.target.value)}
                    placeholder="sk-..."
                  />
                </div>
              )}

              {/* Privacy notice */}
              <div style={{
                padding: '10px 12px',
                borderRadius: 8,
                marginBottom: 16,
                fontSize: '0.8rem',
                background: settingsProvider === 'ollama' ? '#ecfdf5' : '#eff6ff',
                border: `1px solid ${settingsProvider === 'ollama' ? '#10b981' : '#3b82f6'}`,
              }}>
                {settingsProvider === 'ollama' ? (
                  <>🏠 <strong>本地模式：</strong>内容仅在本地模型处理，不上传云端</>
                ) : (
                  <>☁️ <strong>云端模式：</strong>内容将发送至 {settingsProvider.toUpperCase()} 服务器</>
                )}
              </div>

              {/* Test result */}
              {settingsTestResult && (
                <div style={{
                  padding: '12px',
                  borderRadius: 8,
                  marginBottom: 16,
                  fontSize: '0.85rem',
                  background: settingsTestResult.success ? '#ecfdf5' : '#fef2f2',
                  border: `1px solid ${settingsTestResult.success ? '#10b981' : '#ef4444'}`,
                }}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>
                    {settingsTestResult.success ? '✅ 连接成功' : '❌ 连接失败'}
                  </div>
                  <div style={{ wordBreak: 'break-word' }}>{settingsTestResult.message}</div>
                </div>
              )}

              {/* Test button */}
              <button
                className="btn btn-secondary btn-block"
                onClick={handleTestConnection}
                disabled={settingsTesting}
              >
                {settingsTesting ? '测试中...' : '🔌 测试连接'}
              </button>

              <div style={{
                marginTop: 12,
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                textAlign: 'center',
              }}>
                提示：修改 Provider 或 API Key 后需要重启后端服务才能生效
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Knowledge Base Modal */}
      {showNewKBModal && (
        <div className="modal-overlay" onClick={() => setShowNewKBModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">创建知识库</h3>
              <button className="modal-close" onClick={() => setShowNewKBModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">知识库名称</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="例如：写作参考资料"
                  value={newKbName}
                  onChange={(e) => setNewKbName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">描述（可选）</label>
                <textarea
                  className="form-textarea"
                  placeholder="描述知识库的用途..."
                  value={newKbDesc}
                  onChange={(e) => setNewKbDesc(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowNewKBModal(false)}>
                取消
              </button>
              <button className="btn btn-primary" onClick={handleCreateKB}>
                创建
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Character Interview Panel */}
      {showInterviewPanel && interviewMemory && currentProject && (
        <CharacterInterview
          memory={interviewMemory}
          projectId={currentProject.id}
          onClose={() => {
            setShowInterviewPanel(false);
            setInterviewMemory(null);
          }}
          onSaveMemory={(title, content) => {
            createMemory(currentProject!.id, 'character', title, content);
          }}
        />
      )}
    </div>
  );
}

export default App;
