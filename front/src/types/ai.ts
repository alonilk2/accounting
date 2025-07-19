// AI Assistant types and interfaces

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date | string; // Allow both Date objects and ISO date strings
  isLoading?: boolean;
  type?: 'text' | 'interactive';
  interactiveData?: InteractiveMessageData;
}

export interface InteractiveMessageData {
  componentType: 'confirmation' | 'form' | 'selection' | 'action';
  title: string;
  description?: string;
  data?: unknown;
  actions?: InteractiveAction[];
  fields?: FormField[];
  options?: SelectionOption[];
  onComplete?: (result: unknown) => void;
}

export interface InteractiveAction {
  id: string;
  label: string;
  variant: 'contained' | 'outlined' | 'text';
  color?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
  action: string;
  data?: unknown;
}

export interface FormField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'password' | 'select' | 'date' | 'textarea';
  required?: boolean;
  defaultValue?: unknown;
  options?: { value: unknown; label: string }[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
}

export interface SelectionOption {
  id: string;
  label: string;
  description?: string;
  value: unknown;
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
  confidenceScore?: number;
  responseTimeMs?: number;
  isSuccess: boolean;
  isSuccessful?: boolean; // backward compatibility
  errorMessage?: string;
  suggestedActions?: SuggestedAction[];
  metadata?: Record<string, unknown>;
  hasFunctionCalls?: boolean;
  executedFunctions?: string[];
  type?: 'text' | 'interactive';
  interactiveData?: InteractiveMessageData;
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

export interface ChatSessionsResponse {
  sessions: ChatSession[];
  totalCount: number;
}
