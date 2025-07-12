import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { aiAssistantAPI } from '../services/aiAssistantService';
import type { 
  ChatMessage, 
  ChatRequest,
  ChatContext,
  AIAssistantState
} from '../types/ai';

interface AIAssistantActions {
  // UI state management
  openAssistant: () => void;
  closeAssistant: () => void;
  toggleAssistant: () => void;
  
  // Message management
  sendMessage: (message: string, context?: ChatContext) => Promise<void>;
  addMessage: (message: ChatMessage) => void;
  clearMessages: () => void;
  setTyping: (isTyping: boolean) => void;
  
  // Session management
  createNewSession: () => void;
  loadSession: (sessionId: string) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  loadSessions: () => Promise<void>;
  
  // Error handling
  setError: (error: string | null) => void;
  clearError: () => void;
}

type AIAssistantStore = AIAssistantState & AIAssistantActions;

// Generate unique ID for messages
const generateMessageId = () => `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
const generateSessionId = () => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const useAIAssistantStore = create<AIAssistantStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        isOpen: false,
        currentSession: null,
        sessions: [],
        messages: [],
        isLoading: false,
        error: null,
        isTyping: false,

        // UI actions
        openAssistant: () => {
          set({ isOpen: true }, false, 'ai/open');
        },

        closeAssistant: () => {
          set({ isOpen: false }, false, 'ai/close');
        },

        toggleAssistant: () => {
          const { isOpen } = get();
          set({ isOpen: !isOpen }, false, 'ai/toggle');
        },

        // Message actions
        sendMessage: async (message: string, context?: ChatContext) => {
          const state = get();
          
          // Create user message
          const userMessage: ChatMessage = {
            id: generateMessageId(),
            content: message,
            sender: 'user',
            timestamp: new Date(),
          };

          // Add user message immediately
          set({ 
            messages: [...state.messages, userMessage],
            isLoading: true,
            error: null,
            isTyping: true
          }, false, 'ai/send-message-start');

          try {
            const request: ChatRequest = {
              message,
              sessionId: state.currentSession || undefined,
              context
            };

            const response = await aiAssistantAPI.sendMessage(request);

            // Create assistant message
            const assistantMessage: ChatMessage = {
              id: generateMessageId(),
              content: response.message,
              sender: 'assistant',
              timestamp: new Date(),
            };

            // Update state with response
            set(state => ({
              messages: [...state.messages, assistantMessage],
              currentSession: response.sessionId,
              isLoading: false,
              isTyping: false
            }), false, 'ai/send-message-success');

          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'שגיאה לא ידועה';
            set(state => ({
              messages: state.messages.filter(m => m.id !== userMessage.id), // Remove user message on error
              isLoading: false,
              isTyping: false,
              error: errorMessage
            }), false, 'ai/send-message-error');
          }
        },

        addMessage: (message: ChatMessage) => {
          set(state => ({
            messages: [...state.messages, message]
          }), false, 'ai/add-message');
        },

        clearMessages: () => {
          set({ messages: [], currentSession: null }, false, 'ai/clear-messages');
        },

        setTyping: (isTyping: boolean) => {
          set({ isTyping }, false, 'ai/set-typing');
        },

        // Session actions
        createNewSession: () => {
          const sessionId = generateSessionId();
          set({ 
            currentSession: sessionId,
            messages: []
          }, false, 'ai/create-session');
        },

        loadSession: async (sessionId: string) => {
          set({ isLoading: true, error: null }, false, 'ai/load-session-start');
          
          try {
            const messages = await aiAssistantAPI.getSessionMessages(sessionId);
            const chatMessages: ChatMessage[] = messages.map(msg => ({
              id: generateMessageId(),
              content: msg.message,
              sender: 'assistant', // Assuming all stored messages are from assistant
              timestamp: new Date(),
            }));

            set({
              currentSession: sessionId,
              messages: chatMessages,
              isLoading: false
            }, false, 'ai/load-session-success');

          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'טעינת הצ\'אט נכשלה';
            set({
              isLoading: false,
              error: errorMessage
            }, false, 'ai/load-session-error');
          }
        },

        deleteSession: async (sessionId: string) => {
          set({ isLoading: true, error: null }, false, 'ai/delete-session-start');
          
          try {
            await aiAssistantAPI.deleteSession(sessionId);
            
            const state = get();
            const updatedSessions = state.sessions.filter(s => s.id !== sessionId);
            
            // If we're deleting the current session, clear messages
            const shouldClearMessages = state.currentSession === sessionId;
            
            set({
              sessions: updatedSessions,
              currentSession: shouldClearMessages ? null : state.currentSession,
              messages: shouldClearMessages ? [] : state.messages,
              isLoading: false
            }, false, 'ai/delete-session-success');

          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'מחיקת הצ\'אט נכשלה';
            set({
              isLoading: false,
              error: errorMessage
            }, false, 'ai/delete-session-error');
          }
        },

        loadSessions: async () => {
          set({ isLoading: true, error: null }, false, 'ai/load-sessions-start');
          
          try {
            const sessions = await aiAssistantAPI.getChatSessions();
            set({
              sessions,
              isLoading: false
            }, false, 'ai/load-sessions-success');

          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'טעינת רשימת הצ\'אטים נכשלה';
            set({
              isLoading: false,
              error: errorMessage
            }, false, 'ai/load-sessions-error');
          }
        },

        // Error handling
        setError: (error: string | null) => {
          set({ error }, false, 'ai/set-error');
        },

        clearError: () => {
          set({ error: null }, false, 'ai/clear-error');
        },
      }),
      {
        name: 'ai-assistant-storage',
        // Only persist certain fields
        partialize: (state) => ({
          currentSession: state.currentSession,
          sessions: state.sessions,
          messages: state.messages
        }),
      }
    ),
    {
      name: 'ai-assistant-store',
    }
  )
);
