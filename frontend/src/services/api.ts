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
  ChatRequest,
  ChatResponse,
  SearchRequest,
  SearchResult,
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

export default api;
