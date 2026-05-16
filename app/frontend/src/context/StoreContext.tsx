import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { Project, Session, Memory, KnowledgeBase, Message, Chapter, ChapterStatus } from '../types';
import { projectsApi, sessionsApi, memoriesApi, knowledgeBasesApi, messagesApi, chaptersApi } from '../services/api';

interface StoreContextType {
  // State
  projects: Project[];
  currentProject: Project | null;
  currentSession: Session | null;
  sessions: Session[];
  memories: Memory[];
  knowledgeBases: KnowledgeBase[];
  messages: Message[];
  chapters: Chapter[];
  isLoading: boolean;
  
  // Actions
  loadProjects: () => Promise<void>;
  createProject: (name: string, description?: string) => Promise<Project>;
  updateProject: (id: string, name: string, description: string) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  selectProject: (project: Project | null) => void;
  
  loadSessions: (projectId: string) => Promise<void>;
  createSession: (projectId: string, name?: string) => Promise<Session>;
  selectSession: (session: Session | null) => void;
  deleteSession: (id: string) => Promise<void>;
  
  loadMemories: (projectId: string) => Promise<void>;
  createMemory: (projectId: string, type: string, title: string, content: string) => Promise<Memory>;
  updateMemory: (id: string, type: string, title: string, content: string) => Promise<void>;
  deleteMemory: (id: string) => Promise<void>;
  
  loadKnowledgeBases: (projectId: string) => Promise<void>;
  createKnowledgeBase: (projectId: string, name: string, description?: string) => Promise<KnowledgeBase>;
  deleteKnowledgeBase: (id: string) => Promise<void>;
  
  loadMessages: (sessionId: string) => Promise<void>;

  loadChapters: (projectId: string) => Promise<void>;
  createChapter: (projectId: string, title: string, summary?: string, content?: string, status?: ChapterStatus) => Promise<Chapter>;
  updateChapter: (id: string, data: { title?: string; summary?: string; content?: string; status?: ChapterStatus; order_index?: number }) => Promise<void>;
  deleteChapter: (id: string) => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadProjects = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await projectsApi.getAll();
      setProjects(data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createProject = useCallback(async (name: string, description?: string) => {
    const project = await projectsApi.create({ name, description });
    setProjects(prev => [project, ...prev]);
    return project;
  }, []);

  const updateProject = useCallback(async (id: string, name: string, description: string) => {
    await projectsApi.update(id, { name, description });
    setProjects(prev => prev.map(p => p.id === id ? { ...p, name, description } : p));
    if (currentProject?.id === id) {
      setCurrentProject(prev => prev ? { ...prev, name, description } : null);
    }
  }, [currentProject]);

  const deleteProject = useCallback(async (id: string) => {
    await projectsApi.delete(id);
    setProjects(prev => prev.filter(p => p.id !== id));
    if (currentProject?.id === id) {
      setCurrentProject(null);
      setCurrentSession(null);
      setSessions([]);
      setMemories([]);
      setKnowledgeBases([]);
      setMessages([]);
    }
  }, [currentProject]);

  const selectProject = useCallback(async (project: Project | null) => {
    setCurrentProject(project);
    setCurrentSession(null);
    setMessages([]);
    if (project) {
      await loadSessions(project.id);
      await loadMemories(project.id);
      await loadKnowledgeBases(project.id);
      await loadChapters(project.id);
    } else {
      setSessions([]);
      setMemories([]);
      setKnowledgeBases([]);
      setChapters([]);
    }
  }, []);

  const loadSessions = useCallback(async (projectId: string) => {
    const data = await sessionsApi.getByProject(projectId);
    setSessions(data);
  }, []);

  const createSession = useCallback(async (projectId: string, name?: string) => {
    const session = await sessionsApi.create({ project_id: projectId, name });
    setSessions(prev => [session, ...prev]);
    return session;
  }, []);

  const selectSession = useCallback(async (session: Session | null) => {
    setCurrentSession(session);
    if (session) {
      await loadMessages(session.id);
    } else {
      setMessages([]);
    }
  }, []);

  const deleteSession = useCallback(async (id: string) => {
    await sessionsApi.delete(id);
    setSessions(prev => prev.filter(s => s.id !== id));
    if (currentSession?.id === id) {
      setCurrentSession(null);
      setMessages([]);
    }
  }, [currentSession]);

  const loadMemories = useCallback(async (projectId: string) => {
    const data = await memoriesApi.getByProject(projectId);
    setMemories(data);
  }, []);

  const createMemory = useCallback(async (projectId: string, type: string, title: string, content: string) => {
    const memory = await memoriesApi.create({ project_id: projectId, type: type as any, title, content });
    setMemories(prev => [memory, ...prev]);
    return memory;
  }, []);

  const updateMemory = useCallback(async (id: string, type: string, title: string, content: string) => {
    await memoriesApi.update(id, { type: type as any, title, content });
    setMemories(prev => prev.map(m => m.id === id ? { ...m, type: type as any, title, content } : m));
  }, []);

  const deleteMemory = useCallback(async (id: string) => {
    await memoriesApi.delete(id);
    setMemories(prev => prev.filter(m => m.id !== id));
  }, []);

  const loadKnowledgeBases = useCallback(async (projectId: string) => {
    const data = await knowledgeBasesApi.getByProject(projectId);
    setKnowledgeBases(data);
  }, []);

  const createKnowledgeBase = useCallback(async (projectId: string, name: string, description?: string) => {
    const kb = await knowledgeBasesApi.create({ project_id: projectId, name, description });
    setKnowledgeBases(prev => [kb, ...prev]);
    return kb;
  }, []);

  const deleteKnowledgeBase = useCallback(async (id: string) => {
    await knowledgeBasesApi.delete(id);
    setKnowledgeBases(prev => prev.filter(k => k.id !== id));
  }, []);

  const loadMessages = useCallback(async (sessionId: string) => {
    const data = await messagesApi.getBySession(sessionId);
    setMessages(data);
  }, []);

  const loadChapters = useCallback(async (projectId: string) => {
    const data = await chaptersApi.getByProject(projectId);
    setChapters(data.chapters);
  }, []);

  const createChapter = useCallback(async (projectId: string, title: string, summary?: string, content?: string, status?: ChapterStatus) => {
    const chapter = await chaptersApi.create(projectId, {
      title,
      summary: summary || '',
      content: content || '',
      status: status || 'outline',
    });
    setChapters(prev => [...prev, chapter]);
    return chapter;
  }, []);

  const updateChapter = useCallback(async (id: string, data: { title?: string; summary?: string; content?: string; status?: ChapterStatus; order_index?: number }) => {
    const updated = await chaptersApi.update(id, data);
    setChapters(prev => prev.map(c => c.id === id ? updated : c));
  }, []);

  const deleteChapter = useCallback(async (id: string) => {
    await chaptersApi.delete(id);
    setChapters(prev => prev.filter(c => c.id !== id));
  }, []);

  return (
    <StoreContext.Provider
      value={{
        projects,
        currentProject,
        currentSession,
        sessions,
        memories,
        knowledgeBases,
        messages,
        chapters,
        isLoading,
        loadProjects,
        createProject,
        updateProject,
        deleteProject,
        selectProject,
        loadSessions,
        createSession,
        selectSession,
        deleteSession,
        loadMemories,
        createMemory,
        updateMemory,
        deleteMemory,
        loadKnowledgeBases,
        createKnowledgeBase,
        deleteKnowledgeBase,
        loadMessages,
        loadChapters,
        createChapter,
        updateChapter,
        deleteChapter,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
