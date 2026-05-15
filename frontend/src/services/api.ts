import axios from 'axios';
import type {
  Project,
  CreateProjectRequest,
  UpdateProjectRequest,
  Session,
  CreateSessionRequest,
  UpdateSessionRequest,
  Message,
  Memory,
  CreateMemoryRequest,
  UpdateMemoryRequest,
  KnowledgeBase,
  CreateKnowledgeBaseRequest,
  Document,
  DocumentSearchRequest,
  DocumentSearchResponse,
  ChatRequest,
  ChatResponse,
  SearchRequest,
  SearchResult,
  StoryBibleEntry,
  CreateStoryBibleEntryRequest,
  UpdateStoryBibleEntryRequest,
  StoryBibleGenerateResponse,
  ConsistencyCheckRequest,
  ConsistencyCheckResponse,
  SettingsModelsResponse,
  TestConnectionRequest,
  TestConnectionResponse,
  ProviderStatus,
  Chapter,
  ChapterListResponse,
  CreateChapterRequest,
  UpdateChapterRequest,
  CharacterInterviewRequest,
  CharacterInterviewResponse,
  PitchGenerateResponse,
  ProjectTemplate,
  TemplateData,
  CreateProjectFromTemplateRequest,
  ExportTemplateRequest,
  AuthorStyleProfile,
  CreateStyleProfileRequest,
  StyleRewriteRequest,
  StyleRewriteResponse,
  PromotionGenerateRequest,
  PromotionGenerateResponse,
} from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Projects API
export const projectsApi = {
  getAll: () => api.get<Project[]>('/projects').then(res => res.data),
  getById: (id: string) => api.get<Project>(`/projects/${id}`).then(res => res.data),
  create: (data: CreateProjectRequest) => api.post<Project>('/projects', data).then(res => res.data),
  update: (id: string, data: UpdateProjectRequest) => api.put<Project>(`/projects/${id}`, data).then(res => res.data),
  delete: (id: string) => api.delete(`/projects/${id}`).then(res => res.data),
};

// Sessions API
export const sessionsApi = {
  getByProject: (projectId: string) => api.get<Session[]>(`/projects/${projectId}/sessions`).then(res => res.data),
  getById: (id: string) => api.get<Session>(`/sessions/${id}`).then(res => res.data),
  create: (data: CreateSessionRequest) => api.post<Session>(`/projects/${data.project_id}/sessions`, { name: data.name, project_id: data.project_id }).then(res => res.data),
  update: (id: string, data: UpdateSessionRequest) => api.put<Session>(`/sessions/${id}`, data).then(res => res.data),
  delete: (id: string) => api.delete(`/sessions/${id}`).then(res => res.data),
};

// Messages API
export const messagesApi = {
  getBySession: (sessionId: string) => api.get<Message[]>(`/sessions/${sessionId}/messages`).then(res => res.data),
  deleteBySession: (sessionId: string) => api.delete(`/sessions/${sessionId}/messages`).then(res => res.data),
};

// Memories API
export const memoriesApi = {
  getByProject: (projectId: string) => api.get<Memory[]>(`/projects/${projectId}/memories`).then(res => res.data),
  getByProjectAndType: (projectId: string, type: string) => api.get<Memory[]>(`/projects/${projectId}/memories/type/${type}`).then(res => res.data),
  create: (data: CreateMemoryRequest) => api.post<Memory>(`/projects/${data.project_id}/memories`, data).then(res => res.data),
  update: (id: string, data: UpdateMemoryRequest) => api.put<Memory>(`/memories/${id}`, data).then(res => res.data),
  delete: (id: string) => api.delete(`/memories/${id}`).then(res => res.data),
};

// Knowledge Bases API
export const knowledgeBasesApi = {
  getByProject: (projectId: string) => api.get<KnowledgeBase[]>(`/projects/${projectId}/knowledge-bases`).then(res => res.data),
  create: (data: CreateKnowledgeBaseRequest) => api.post<KnowledgeBase>(`/projects/${data.project_id}/knowledge-bases`, data).then(res => res.data),
  delete: (id: string) => api.delete(`/knowledge-bases/${id}`).then(res => res.data),
  getDocuments: (id: string) => api.get<Document[]>(`/knowledge-bases/${id}/documents`).then(res => res.data),
  deleteDocument: (kbId: string, docId: string) => api.delete(`/knowledge-bases/${kbId}/documents/${docId}`).then(res => res.data),
  searchDocuments: (kbId: string, data: DocumentSearchRequest) => api.post<DocumentSearchResponse>(`/knowledge-bases/${kbId}/search`, data).then(res => res.data),
  uploadDocument: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/knowledge-bases/${id}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }).then(res => res.data);
  },
};

// Chat API
export const chatApi = {
  send: (data: ChatRequest) => api.post<ChatResponse>('/chat', data).then(res => res.data),
};

// Search API
export const searchApi = {
  search: (data: SearchRequest) => api.post<SearchResult[]>('/search', data).then(res => res.data),
};

// Story Bible API
export const storyBibleApi = {
  getByProject: (projectId: string) => api.get<StoryBibleEntry[]>(`/projects/${projectId}/story-bible`).then(res => res.data),
  create: (projectId: string, data: CreateStoryBibleEntryRequest) => api.post<StoryBibleEntry>(`/projects/${projectId}/story-bible`, data).then(res => res.data),
  generate: (projectId: string) => api.post<StoryBibleGenerateResponse>(`/projects/${projectId}/story-bible/generate`).then(res => res.data),
  update: (id: string, data: UpdateStoryBibleEntryRequest) => api.put<StoryBibleEntry>(`/story-bible/${id}`, data).then(res => res.data),
  delete: (id: string) => api.delete(`/story-bible/${id}`).then(res => res.data),
};

// Consistency API
export const consistencyApi = {
  check: (projectId: string, data: ConsistencyCheckRequest) => api.post<ConsistencyCheckResponse>(`/projects/${projectId}/consistency-check`, data).then(res => res.data),
};

// Settings API
export const settingsApi = {
  getModels: () => api.get<SettingsModelsResponse>('/settings/models').then(res => res.data),
  testConnection: (data: TestConnectionRequest) => api.post<TestConnectionResponse>('/settings/models/test', data).then(res => res.data),
  getProviderStatus: () => api.get<ProviderStatus>('/settings/provider-status').then(res => res.data),
};

// Chapters API
export const chaptersApi = {
  getByProject: (projectId: string) => api.get<ChapterListResponse>(`/projects/${projectId}/chapters`).then(res => res.data),
  getById: (id: string) => api.get<Chapter>(`/chapters/${id}`).then(res => res.data),
  create: (projectId: string, data: CreateChapterRequest) => api.post<Chapter>(`/projects/${projectId}/chapters`, data).then(res => res.data),
  update: (id: string, data: UpdateChapterRequest) => api.put<Chapter>(`/chapters/${id}`, data).then(res => res.data),
  delete: (id: string) => api.delete(`/chapters/${id}`).then(res => res.data),
};

// Character Interview API
export const characterApi = {
  interview: (projectId: string, memoryId: string, data: CharacterInterviewRequest) =>
    api.post<CharacterInterviewResponse>(`/projects/${projectId}/characters/${memoryId}/interview`, data).then(res => res.data),
};

// Pitch API
export const pitchApi = {
  generate: (projectId: string) =>
    api.post<PitchGenerateResponse>(`/projects/${projectId}/pitch/generate`).then(res => res.data),
};

// Templates API
export const templatesApi = {
  getAll: (genre?: string) => {
    const params = genre ? { genre } : {};
    return api.get<ProjectTemplate[]>('/templates', { params }).then(res => res.data);
  },
  getById: (id: string) => api.get<ProjectTemplate>(`/templates/${id}`).then(res => res.data),
  create: (data: {
    name: string;
    description?: string;
    genre: string;
    template_data: TemplateData;
    is_public?: boolean;
  }) => api.post<ProjectTemplate>('/templates', data).then(res => res.data),
  createProject: (templateId: string, data?: CreateProjectFromTemplateRequest) =>
    api.post<Project>(`/templates/${templateId}/create-project`, data || {}).then(res => res.data),
  exportProject: (projectId: string, data: ExportTemplateRequest) =>
    api.post<ProjectTemplate>(`/projects/${projectId}/export-template`, data).then(res => res.data),
  delete: (id: string) => api.delete(`/templates/${id}`).then(res => res.data),
};

// Author Style DNA API
export const styleApi = {
  getByProject: (projectId: string) =>
    api.get<AuthorStyleProfile[]>(`/projects/${projectId}/style-profiles`).then(res => res.data),
  create: (projectId: string, data: CreateStyleProfileRequest) =>
    api.post<AuthorStyleProfile>(`/projects/${projectId}/style-profiles`, data).then(res => res.data),
  getById: (id: string) =>
    api.get<AuthorStyleProfile>(`/style-profiles/${id}`).then(res => res.data),
  delete: (id: string) =>
    api.delete(`/style-profiles/${id}`),
  rewrite: (styleId: string, data: StyleRewriteRequest) =>
    api.post<StyleRewriteResponse>(`/style-profiles/${styleId}/rewrite`, data).then(res => res.data),
};

// Promotion API
export const promotionApi = {
  generate: (projectId: string, data: PromotionGenerateRequest) =>
    api.post<PromotionGenerateResponse>(`/projects/${projectId}/promotion/generate`, data).then(res => res.data),
};

export default api;
