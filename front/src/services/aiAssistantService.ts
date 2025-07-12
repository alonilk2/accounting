import api from './api';
import type { 
  ChatRequest, 
  ChatResponse, 
  ChatSession 
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
      const response = await api.get<ChatSession[]>('/aiassistant/sessions');
      return response.data;
    } catch (error) {
      console.error('Failed to get chat sessions:', error);
      return []; // Return empty array on error for better UX
    }
  },

  // Get messages for a specific session
  async getSessionMessages(sessionId: string): Promise<ChatResponse[]> {
    try {
      const response = await api.get<ChatResponse[]>(`/aiassistant/sessions/${sessionId}/messages`);
      return response.data;
    } catch (error) {
      console.error('Failed to get session messages:', error);
      return [];
    }
  },

  // Delete a chat session
  async deleteSession(sessionId: string): Promise<void> {
    try {
      await api.delete(`/aiassistant/sessions/${sessionId}`);
    } catch (error) {
      console.error('Failed to delete session:', error);
      throw new Error('מחיקת הצ\'אט נכשלה');
    }
  },

  // Clear all chat history
  async clearAllSessions(): Promise<void> {
    try {
      await api.delete('/aiassistant/sessions');
    } catch (error) {
      console.error('Failed to clear all sessions:', error);
      throw new Error('מחיקת כל הצ\'אטים נכשלה');
    }
  }
};
