import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../hooks/useChat';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import { MessageCircleIcon, PlusIcon, MenuIcon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const ChatArea = ({ chatId, onNewChat, onChatTitleUpdate, onToggleSidebar, isSidebarVisible }) => {
  const { messages, chatInfo, loading, error, sendMessage, sendFeedback } = useChat(chatId);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const { isDark } = useTheme();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (content, options) => {
    try {
      setIsTyping(true);
      const response = await sendMessage(content, options);
      // If title was updated, refresh the chat list
      if (response?.title && onChatTitleUpdate) {
        onChatTitleUpdate();
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsTyping(false);
    }
  };

  if (!chatId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center max-w-2xl mx-auto px-4">
          <div className="mb-8">
            <img 
              src="/images/spintly-logo.png" 
              alt="Spintly Logo" 
              className="w-40 h-40 mx-auto mb-12 rounded-3xl shadow-2xl hover:shadow-3xl hover:scale-105 transition-all duration-300"
              onError={(e) => {
                // Use placeholder if logo not found
                e.target.src = '/images/placeholder-logo.svg';
              }}
            />
            <h1 className="text-6xl font-extrabold mb-8 bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 bg-clip-text text-transparent tracking-wide drop-shadow-sm">
              KnowledgeBase Pro
            </h1>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-8 tracking-wider uppercase">
              Powered by Spintly
            </p>
            <p className="text-xl text-gray-600 dark:text-gray-300 font-light mb-8">
              How can I help you today?
            </p>
            
            {/* Start Chat Button */}
            <button
              onClick={onNewChat}
              className="group px-8 py-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-700 text-white font-bold text-lg rounded-2xl shadow-2xl hover:shadow-emerald-500/25 transform hover:scale-105 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative z-10 flex items-center gap-3">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="group-hover:rotate-12 transition-transform duration-300">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Start New Chat
              </span>
            </button>
            
            {/* Or access chat history */}
            <div className="mt-6 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600"></div>
              <span>or access your chat history</span>
              <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600"></div>
            </div>
            
            <button
              onClick={onToggleSidebar}
              className="mt-4 px-6 py-2 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-all duration-300"
            >
              View Chat History →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 relative">
      {/* Floating New Chat Button - only show when no chat is active */}
      {!chatId && (
        <button
          onClick={onNewChat}
          className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-full shadow-2xl hover:shadow-emerald-500/25 transition-all duration-300 hover:scale-110 z-50 flex items-center justify-center group"
          title="Start New Chat"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="group-hover:rotate-90 transition-transform duration-300">
            <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}

      {/* Chat Header */}
      <div className="sticky top-0 z-10 bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleSidebar}
              className="relative p-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 group"
              title={isSidebarVisible ? 'Close Chat History' : 'Open Chat History'}
            >
              <MenuIcon size={22} className="group-hover:rotate-180 transition-transform duration-300" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
            </button>
            <h1 className="text-lg font-medium text-gray-900 dark:text-white">
              {chatInfo?.title || 'New conversation'}
            </h1>
          </div>
          
          {loading && (
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
              <span className="text-sm">Loading...</span>
            </div>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        {error && (
          <div className="p-4 m-4 bg-red-900/20 border border-red-500/30 rounded-lg text-red-400">
            <strong>Error:</strong> {error}
          </div>
        )}

        <MessageList 
          messages={messages} 
          onFeedback={sendFeedback}
          isTyping={isTyping}
        />
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <ChatInput 
          onSendMessage={handleSendMessage}
          disabled={!chatId || isTyping}
        />
      </div>
    </div>
  );
};

export default ChatArea;