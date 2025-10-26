import React from 'react';
import { PlusIcon, MessageCircleIcon, TrashIcon, LoaderIcon, SunIcon, MoonIcon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const Sidebar = ({ 
  chats, 
  currentChatId, 
  onNewChat, 
  onSelectChat, 
  onDeleteChat, 
  loading, 
  error,
  isVisible,
  onToggleVisibility
}) => {
  const { isDark, toggleTheme } = useTheme();

  if (!isVisible) return null;

  return (
    <div className="w-80 bg-gradient-to-br from-white via-slate-50 to-gray-100 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800 border-r border-gray-200/60 dark:border-gray-700/60 flex flex-col h-full shadow-2xl backdrop-blur-xl animate-slide-in-left">
      {/* Header */}
      <div className="p-6 border-b border-gradient-to-r from-emerald-200/30 to-teal-200/30 dark:from-emerald-800/30 dark:to-teal-800/30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg">
        {/* Title Only */}
        <div className="mb-8 text-center relative">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 to-teal-400/20 blur-3xl rounded-full transform -translate-y-2"></div>
          <h1 className="relative text-2xl font-black bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 bg-clip-text text-transparent tracking-wide drop-shadow-lg">
            KnowledgeBase Pro
          </h1>
        </div>
        
        <button
          onClick={onNewChat}
          className="group w-full flex items-center gap-4 px-6 py-4 text-sm font-bold text-white bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-700 rounded-2xl shadow-2xl hover:shadow-emerald-500/25 transform hover:scale-[1.02] hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <PlusIcon size={20} className="relative z-10 group-hover:rotate-90 transition-transform duration-300" />
          <span className="relative z-10 tracking-wide">New Chat</span>
        </button>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto px-4 py-4 scrollbar-thin scrollbar-thumb-emerald-300 dark:scrollbar-thumb-emerald-700">
        {loading && (
          <div className="flex items-center justify-center p-6">
            <div className="relative">
              <LoaderIcon className="animate-spin text-emerald-500" size={24} />
              <div className="absolute inset-0 bg-emerald-400/20 blur-lg rounded-full animate-pulse"></div>
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 mx-2 mb-3 bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border border-red-200 dark:border-red-800 rounded-2xl text-red-700 dark:text-red-300 text-sm shadow-lg">
            <div className="font-semibold mb-1">Error</div>
            {error}
          </div>
        )}

        {!loading && !error && chats.length === 0 && (
          <div className="p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-2xl flex items-center justify-center">
              <MessageCircleIcon size={24} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-gray-600 dark:text-gray-300 font-medium mb-1">No conversations yet</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Start your first chat to see it here</div>
          </div>
        )}

        {!loading && chats.map((chat) => (
          <ChatItem
            key={chat.id}
            chat={chat}
            isActive={currentChatId === chat.id}
            onSelect={() => onSelectChat(chat.id)}
            onDelete={() => onDeleteChat(chat.id)}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-gradient-to-r from-emerald-200/30 to-teal-200/30 dark:from-emerald-800/30 dark:to-teal-800/30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg">
        <div className="flex items-center justify-between">
          <div className="text-xs font-medium text-gray-600 dark:text-gray-300">
            v1.0.0
          </div>
          <button
            onClick={toggleTheme}
            className="group p-3 text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50 dark:hover:from-emerald-900/20 dark:hover:to-teal-900/20 rounded-2xl transition-all duration-300 hover:scale-110 hover:shadow-lg"
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? (
              <SunIcon size={20} className="group-hover:rotate-180 transition-transform duration-500" />
            ) : (
              <MoonIcon size={20} className="group-hover:rotate-12 transition-transform duration-500" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const ChatItem = ({ chat, isActive, onSelect, onDelete }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div
      className={`group relative mb-3 cursor-pointer transition-all duration-300 rounded-2xl transform hover:scale-[1.01] ${
        isActive 
          ? 'bg-gradient-to-r from-emerald-50 via-white to-teal-50 dark:from-emerald-900/40 dark:via-gray-800 dark:to-teal-900/40 border-2 border-emerald-300 dark:border-emerald-600 shadow-lg shadow-emerald-500/10' 
          : 'hover:bg-gradient-to-r hover:from-white/90 hover:to-gray-50/90 dark:hover:from-gray-800/80 dark:hover:to-gray-700/80 hover:shadow-lg hover:shadow-gray-500/5 border-2 border-transparent hover:border-gray-200/50 dark:hover:border-gray-600/50'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-center gap-3 p-4">
        <div className="flex-1 min-w-0">
          <div className={`text-sm font-bold truncate ${
            isActive ? 'text-emerald-800 dark:text-emerald-200' : 'text-gray-800 dark:text-gray-100'
          } transition-colors duration-300`}>
            {chat.title || 'New conversation'}
          </div>
          {chat.updated_at && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">
              {formatDate(chat.updated_at)}
            </div>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-300 transform hover:scale-110"
          title="Delete chat"
        >
          <TrashIcon size={16} />
        </button>
      </div>
    </div>
  );
};

export default Sidebar;