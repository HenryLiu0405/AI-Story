import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import toast, { Toaster } from 'react-hot-toast';
import { useStore } from './context/StoreContext';
import { chatApi, knowledgeBasesApi, storyBibleApi, consistencyApi } from './services/api';
import type { ConsistencyIssue, Document, Memory, MemoryType, StoryBibleCategory, StoryBibleEntry } from './types';
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
  } = useStore();

  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showNewSessionModal, setShowNewSessionModal] = useState(false);
  const [showNewMemoryModal, setShowNewMemoryModal] = useState(false);
  const [showNewKBModal, setShowNewKBModal] = useState(false);
  const [showEditMemoryModal, setShowEditMemoryModal] = useState(false);
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [sidebarTab, setSidebarTab] = useState<'sessions' | 'memories' | 'knowledge' | 'storyBible' | 'consistency'>('sessions');
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
          <h1>📚 AI小说助手</h1>
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

            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {currentSession ? (
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
        <div className="modal-overlay" onClick={() => setShowNewProjectModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">新建项目</h3>
              <button className="modal-close" onClick={() => setShowNewProjectModal(false)}>×</button>
            </div>
            <div className="modal-body">
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
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowNewProjectModal(false)}>
                取消
              </button>
              <button className="btn btn-primary" onClick={handleCreateProject}>
                创建
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
    </div>
  );
}

export default App;
