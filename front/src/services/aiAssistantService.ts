import api from './api';
import type { 
  ChatRequest, 
  ChatResponse, 
  ChatSession,
  ChatSessionsResponse
} from '../types/ai';

export const aiAssistantAPI = {
  // Send a message to the AI assistant
  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    try {
      const response = await api.post<ChatResponse>('/aiassistant/chat', request);
      return response.data;
    } catch (error) {
      console.error('Failed to send message to AI assistant:', error);
      throw new Error('שליחת ההודעה לעוזר הבינה המלאכותית נכשלה');
    }
  },

  // Get chat history/sessions
  async getChatSessions(): Promise<ChatSession[]> {
    try {
      const response = await api.get<ChatSessionsResponse>('/aiassistant/sessions');
      return response.data.sessions;
    } catch (error) {
      console.error('Failed to get chat sessions:', error);
      return []; // Return empty array on error for better UX
    }
  },

  // Get messages for a specific session
  async getSessionMessages(sessionId: string): Promise<ChatResponse[]> {
    try {
      interface HistoryMessage {
        content: string;
        role: string;
        confidenceScore?: number;
        responseTimeMs?: number;
      }
      
      const response = await api.get<{ messages: HistoryMessage[] }>(`/aiassistant/history?sessionId=${sessionId}`);
      // Convert backend message format to frontend format
      return response.data.messages.map(msg => ({
        message: msg.content,
        sessionId: sessionId,
        isSuccess: true,
        confidenceScore: msg.confidenceScore || 0,
        responseTimeMs: msg.responseTimeMs || 0,
      }));
    } catch (error) {
      console.error('Failed to get session messages:', error);
      return [];
    }
  },

  // Delete a chat session
  async deleteSession(sessionId: string): Promise<void> {
    try {
      await api.delete(`/aiassistant/history/${sessionId}`);
    } catch (error) {
      console.error('Failed to delete session:', error);
      throw new Error('מחיקת הצ\'אט נכשלה');
    }
  },

  // Clear all chat history
  async clearAllSessions(): Promise<void> {
    try {
      await api.delete('/aiassistant/history');
    } catch (error) {
      console.error('Failed to clear all sessions:', error);
      throw new Error('מחיקת כל הצ\'אטים נכשלה');
    }
  }
};
