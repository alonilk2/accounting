// AI Assistant types and interfaces

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date | string; // Allow both Date objects and ISO date strings
  isLoading?: boolean;
}

export interface ChatContext {
  currentPage?: string;
  filters?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface ChatRequest {
  message: string;
  sessionId?: string;
  context?: ChatContext;
}

export interface ChatResponse {
  message: string;
  sessionId: string;
  confidenceScore: number;
  responseTimeMs: number;
  isSuccessful: boolean;
  suggestedActions?: SuggestedAction[];
  metadata?: Record<string, unknown>;
}

export interface SuggestedAction {
  id: string;
  type: 'navigation' | 'action' | 'report' | 'query';
  label: string;
  description?: string;
  icon?: string;
  action: string;
  parameters?: Record<string, unknown>;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: Date | string; // Allow both Date objects and ISO date strings
  updatedAt: Date | string; // Allow both Date objects and ISO date strings
  messageCount: number;
  lastMessage?: string;
}

export interface AIAssistantState {
  isOpen: boolean;
  currentSession: string | null;
  sessions: ChatSession[];
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  isTyping: boolean;
}
