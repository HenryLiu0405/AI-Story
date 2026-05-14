// Memory types
export type MemoryType = 'character' | 'world' | 'plot' | 'custom';
export type MessageRole = 'user' | 'assistant' | 'system';

// Project
export interface Project {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
}

// Session
export interface Session {
  id: string;
  project_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface CreateSessionRequest {
  project_id: string;
  name?: string;
}

export interface UpdateSessionRequest {
  name?: string;
}

// Message
export interface Message {
  id: string;
  session_id: string;
  role: MessageRole;
  content: string;
  created_at: string;
}

// Memory
export interface Memory {
  id: string;
  project_id: string;
  type: MemoryType;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface CreateMemoryRequest {
  project_id: string;
  type: MemoryType;
  title: string;
  content: string;
}

export interface UpdateMemoryRequest {
  type?: MemoryType;
  title?: string;
  content?: string;
}

// Knowledge Base
export interface KnowledgeBase {
  id: string;
  project_id: string;
  name: string;
  description: string;
  created_at: string;
}

export interface CreateKnowledgeBaseRequest {
  project_id: string;
  name: string;
  description?: string;
}

export interface Document {
  id: string;
  knowledge_base_id: string;
  filename: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface DocumentSearchRequest {
  query: string;
  top_k?: number;
}

export interface DocumentSearchResult {
  id: string;
  content: string;
  metadata: Record<string, any>;
  distance: number;
  knowledge_base_id: string;
  knowledge_base: string;
}

export interface DocumentSearchResponse {
  results: DocumentSearchResult[];
}

// Chat
export interface ChatRequest {
  session_id: string;
  project_id: string;
  message: string;
}

export interface ChatResponse {
  message: Message;
  context_used: string[];
}

// Search
export interface SearchRequest {
  query: string;
  knowledge_base_id?: string;
  project_id?: string;
  top_k?: number;
}

export interface SearchResult {
  content: string;
  metadata: Record<string, any>;
  score: number;
}

// Story Bible
export type StoryBibleCategory =
  | 'character'
  | 'world_rule'
  | 'location'
  | 'faction'
  | 'timeline'
  | 'plot_thread'
  | 'foreshadowing'
  | 'theme'
  | 'style_rule'
  | 'note';

export interface StoryBibleEntry {
  id: string;
  project_id: string;
  category: StoryBibleCategory;
  title: string;
  content: string;
  source_type: string;
  source_id?: string | null;
  locked: boolean;
  confidence: number;
  created_at: string;
  updated_at: string;
}

export interface CreateStoryBibleEntryRequest {
  category: StoryBibleCategory;
  title: string;
  content: string;
  source_type?: string;
  source_id?: string | null;
  locked?: boolean;
  confidence?: number;
}

export interface UpdateStoryBibleEntryRequest {
  category?: StoryBibleCategory;
  title?: string;
  content?: string;
  locked?: boolean;
  confidence?: number;
}

export interface StoryBibleGenerateResponse {
  entries: StoryBibleEntry[];
  created_count: number;
}

// Consistency Check
export interface ConsistencyCheckRequest {
  text: string;
  include_memories?: boolean;
  include_story_bible?: boolean;
  include_knowledge_base?: boolean;
  scope?: string[];
}

export interface ConsistencyIssue {
  severity: 'low' | 'medium' | 'high' | string;
  type: string;
  issue: string;
  evidence: string;
  suggestion: string;
}

export interface ConsistencyCheckResponse {
  issues: ConsistencyIssue[];
}
