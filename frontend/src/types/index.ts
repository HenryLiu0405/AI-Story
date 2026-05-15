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
  severity: string;
  type: string;
  issue: string;
  evidence: string;
  suggestion: string;
}

export interface ConsistencyCheckResponse {
  issues: ConsistencyIssue[];
}

// Settings / AI Models
export type AIProvider = 'openai' | 'deepseek' | 'ollama';

export interface AIModelInfo {
  id: string;
  name: string;
  provider: AIProvider;
  is_local: boolean;
}

export interface SettingsModelsResponse {
  models: AIModelInfo[];
  current_provider: AIProvider;
  current_model: string;
}

export interface TestConnectionRequest {
  provider: string;
  api_key: string;
  base_url: string;
  model: string;
}

export interface TestConnectionResponse {
  success: boolean;
  message: string;
}

export interface ProviderStatus {
  provider: AIProvider;
  is_configured: boolean;
  is_local: boolean;
  model: string;
}

// Chapter
export type ChapterStatus = 'outline' | 'draft' | 'revising' | 'done';

export interface Chapter {
  id: string;
  project_id: string;
  title: string;
  summary: string;
  content: string;
  status: ChapterStatus;
  order_index: number;
  word_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateChapterRequest {
  title: string;
  summary?: string;
  content?: string;
  status?: ChapterStatus;
  order_index?: number;
}

export interface UpdateChapterRequest {
  title?: string;
  summary?: string;
  content?: string;
  status?: ChapterStatus;
  order_index?: number;
}

export interface ChapterListResponse {
  chapters: Chapter[];
  total: number;
}

// Character Interview
export interface CharacterInterviewRequest {
  question: string;
  conversation_history?: { role: string; content: string }[];
}

export interface CharacterInterviewResponse {
  answer: string;
  voice_notes: string;
  possible_new_memory?: {
    title: string;
    content: string;
  };
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

// Pitch / 企划案
export interface PitchCharacterInfo {
  name: string;
  role: string;
  description: string;
}

export interface PitchGenerateResponse {
  project_id: string;
  logline: string;
  synopsis: string;
  selling_points: string[];
  main_characters: PitchCharacterInfo[];
  world_summary: string;
  cover_prompt: string;
  target_audience: string;
  social_posts: string[];
  generated_at: string;
}

// Project Template
export type TemplateGenre = 'xuanhuan' | 'mystery' | 'urban' | 'romance' | 'scifi';

export interface TemplateMemoryItem {
  type: string;
  title: string;
  content: string;
}

export interface TemplateBibleItem {
  category: string;
  title: string;
  content: string;
}

export interface TemplateData {
  project_description: string;
  memories: TemplateMemoryItem[];
  story_bible_entries: TemplateBibleItem[];
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  genre: TemplateGenre;
  template_data: TemplateData;
  is_public: boolean;
  created_at: string;
}

export interface CreateProjectFromTemplateRequest {
  name_override?: string;
}

export interface ExportTemplateRequest {
  name: string;
  description?: string;
  genre: TemplateGenre;
  is_public?: boolean;
}

// =============================================================================
// Author Style DNA / 文风锁定
// =============================================================================

export interface StyleRuleItem {
  dimension: string;
  description: string;
  example: string;
}

export interface StyleRulesJSON {
  avg_sentence_length: string;
  narrative_pov: string;
  dialogue_ratio: string;
  emotion_density: string;
  rhetorical_devices: string[];
  pacing: string;
  forbidden_styles: string[];
  sample_rules: StyleRuleItem[];
}

export interface AuthorStyleProfile {
  id: string;
  project_id: string;
  name: string;
  sample_text: string;
  style_summary: string;
  rules_json: StyleRulesJSON;
  created_at: string;
  updated_at: string;
}

export interface CreateStyleProfileRequest {
  name: string;
  sample_text: string;
}

export interface StyleRewriteRequest {
  text: string;
}

export interface StyleRewriteResponse {
  original_text: string;
  rewritten_text: string;
  changes_summary: string;
}

// =============================================================================
// Promotion / 内容传播助手 (Phase 7)
// =============================================================================

export type PromotionPlatform = 'xiaohongshu' | 'weibo' | 'douyin' | 'bilibili' | 'twitter';

export type PromotionContentType =
  | 'character_card'
  | 'chapter_teaser'
  | 'world_intro'
  | 'short_video_script'
  | 'interactive_question'
  | 'submission_intro';

export interface PromotionGenerateRequest {
  platform: PromotionPlatform;
  content_type: PromotionContentType;
  tone: string;
  target_reader: string;
}

export interface PromotionGenerateResponse {
  project_id: string;
  platform: string;
  content_type: string;
  tone: string;
  target_reader: string;
  title: string;
  content: string;
  hashtags: string[];
  platform_tips: string;
  generated_at: string;
}
