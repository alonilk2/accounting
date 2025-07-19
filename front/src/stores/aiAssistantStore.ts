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
  handleInteractiveAction: (messageId: string, actionId: string, result?: unknown) => Promise<void>;
  
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

            // Check if the response was successful
            if (!response.isSuccess && !response.isSuccessful) {
              throw new Error(response.errorMessage || 'שגיאה בשליחת ההודעה');
            }

            // Create assistant message
            const assistantMessage: ChatMessage = {
              id: generateMessageId(),
              content: response.message,
              sender: 'assistant',
              timestamp: new Date(),
              type: response.type === 'interactive' ? 'interactive' : 'text',
              interactiveData: response.interactiveData
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

        handleInteractiveAction: async (messageId: string, actionId: string, result?: unknown) => {
          set({ isLoading: true, error: null }, false, 'ai/interactive-action-start');
          
          try {
            const state = get();
            
            // Find the interactive message and update it to show the user's choice
            const updatedMessages = state.messages.map(msg => {
              if (msg.id === messageId && msg.type === 'interactive') {
                return {
                  ...msg,
                  type: 'text' as const,
                  content: `${msg.interactiveData?.title}\n\n✅ ${actionId === 'confirm' ? 'אושר' : actionId === 'cancel' ? 'בוטל' : 'נבחר'}: ${JSON.stringify(result) || actionId}`
                };
              }
              return msg;
            });

            set({ messages: updatedMessages }, false, 'ai/update-interactive-message');

            // Send the action result to the AI
            let actionMessage = '';
            if (actionId === 'confirm') {
              actionMessage = 'המשתמש אישר את הפעולה';
            } else if (actionId === 'cancel') {
              actionMessage = 'המשתמש ביטל את הפעולה';
            } else if (actionId === 'submit' || actionId === 'select') {
              actionMessage = `המשתמש שלח: ${JSON.stringify(result)}`;
            } else {
              actionMessage = `המשתמש בחר: ${actionId}`;
            }

            // Send follow-up message to AI
            const request: ChatRequest = {
              message: actionMessage,
              sessionId: state.currentSession || undefined,
              context: {
                currentPage: 'ai-assistant',
                metadata: { 
                  interactiveResponse: true,
                  originalMessageId: messageId,
                  actionId,
                  result 
                }
              }
            };

            const response = await aiAssistantAPI.sendMessage(request);

            // Create assistant response message
            const assistantMessage: ChatMessage = {
              id: generateMessageId(),
              content: response.message,
              sender: 'assistant',
              timestamp: new Date(),
            };

            set(state => ({
              messages: [...state.messages, assistantMessage],
              currentSession: response.sessionId,
              isLoading: false,
            }), false, 'ai/interactive-action-success');

          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'שגיאה בעיבוד הפעולה';
            set({
              isLoading: false,
              error: errorMessage
            }, false, 'ai/interactive-action-error');
          }
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
            const response = await aiAssistantAPI.getSessionMessages(sessionId);
            const chatMessages: ChatMessage[] = response.map((msg, index) => ({
              id: `${sessionId}_${index}`,
              content: msg.message,
              sender: index % 2 === 0 ? 'user' : 'assistant',
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
