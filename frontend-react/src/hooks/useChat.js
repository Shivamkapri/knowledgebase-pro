import { useState, useEffect } from 'react';
import { chatService } from '../services/api';

// Hook for managing chats list
export const useChats = () => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadChats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await chatService.getChats();
      setChats(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createChat = async (title) => {
    try {
      const newChat = await chatService.createChat(title);
      setChats(prev => [newChat, ...prev]);
      return newChat;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const deleteChat = async (chatId) => {
    try {
      await chatService.deleteChat(chatId);
      setChats(prev => prev.filter(chat => chat.id !== chatId));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  useEffect(() => {
    loadChats();
  }, []);

  return {
    chats,
    loading,
    error,
    createChat,
    deleteChat,
    refreshChats: loadChats,
  };
};

// Hook for managing individual chat messages
export const useChat = (chatId) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [chatInfo, setChatInfo] = useState(null);

  const loadChat = async () => {
    if (!chatId) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await chatService.getChat(chatId);
      setChatInfo(data.chat);
      setMessages(data.messages || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (content, options) => {
    if (!chatId || !content.trim()) return;

    // Add user message immediately for better UX
    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      created_at: new Date().toISOString(),
    };
    
    setMessages(prev => [...prev, userMessage]);

    try {
      const response = await chatService.sendMessage(chatId, content, options);
      
      // Add assistant message
      const assistantMessage = {
        id: Date.now().toString() + '_ai',
        role: 'assistant',
        content: response.answer,
        sources: response.sources,
        created_at: new Date().toISOString(),
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // Update chat title if provided
      if (response.title && setChatInfo) {
        setChatInfo(prev => prev ? { ...prev, title: response.title } : null);
      }
      
      return response;
    } catch (err) {
      setError(err.message);
      // Remove the user message on error
      setMessages(prev => prev.filter(msg => msg.id !== userMessage.id));
      throw err;
    }
  };

  const sendFeedback = async (messageId, feedback) => {
    try {
      await chatService.sendFeedback(messageId, feedback);
      // Update the message with feedback
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, feedback } 
            : msg
        )
      );
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  useEffect(() => {
    if (chatId) {
      loadChat();
    } else {
      setMessages([]);
      setChatInfo(null);
    }
  }, [chatId]);

  return {
    messages,
    chatInfo,
    loading,
    error,
    sendMessage,
    sendFeedback,
    refreshChat: loadChat,
  };
};