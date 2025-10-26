import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API service functions
export const chatService = {
  // Get all chats
  async getChats() {
    const response = await api.get('/chats');
    return response.data;
  },

  // Create a new chat
  async createChat(title = 'New chat') {
    const response = await api.post('/chats', { title });
    return response.data;
  },

  // Get a specific chat
  async getChat(chatId) {
    const response = await api.get(`/chats/${chatId}`);
    return response.data;
  },

  // Delete a chat
  async deleteChat(chatId) {
    const response = await api.delete(`/chats/${chatId}`);
    return response.data;
  },

  // Send a message in a chat
  async sendMessage(chatId, content, options = {}) {
    const payload = {
      content,
      top_k: options.topK || 4,
      temperature: options.temperature || 0.3,
      max_tokens: options.maxTokens || 1000,
    };
    const response = await api.post(`/chats/${chatId}/messages`, payload);
    return response.data;
  },

  // Send feedback for a message
  async sendFeedback(messageId, feedback) {
    const response = await api.post(`/chats/messages/${messageId}/feedback`, { feedback });
    return response.data;
  },

  // Health check
  async healthCheck() {
    const response = await api.get('/health');
    return response.data;
  },
};

export default api;