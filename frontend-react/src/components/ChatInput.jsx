import React, { useState } from 'react';
import { SendIcon, SettingsIcon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const ChatInput = ({ onSendMessage, disabled }) => {
  const [message, setMessage] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    maxTokens: 1000,
    temperature: 0.3,
    topK: 4,
  });
  const { isDark } = useTheme();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message.trim() || disabled) return;

    onSendMessage(message.trim(), settings);
    setMessage('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const responseLengthOptions = [
    { value: 500, label: 'Short (500 tokens)' },
    { value: 1000, label: 'Medium (1000 tokens)' },
    { value: 2000, label: 'Long (2000 tokens)' },
    { value: 4000, label: 'Very Long (4000 tokens)' },
  ];

  return (
    <div className="p-4 max-w-4xl mx-auto">
      {/* Settings Panel */}
      {showSettings && (
        <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Response Settings</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-2">Response Length</label>
              <select
                value={settings.maxTokens}
                onChange={(e) => setSettings(prev => ({ ...prev, maxTokens: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              >
                {responseLengthOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-2">
                Temperature ({settings.temperature})
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={settings.temperature}
                onChange={(e) => setSettings(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Lower = more focused, Higher = more creative
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-2">
                Sources to retrieve ({settings.topK})
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={settings.topK}
                onChange={(e) => setSettings(prev => ({ ...prev, topK: parseInt(e.target.value) }))}
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                More sources = broader context
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-end gap-2 p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-2xl shadow-sm focus-within:shadow-md transition-shadow duration-200">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Message knowledgebase-pro..."
            disabled={disabled}
            rows={1}
            className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none focus:outline-none text-sm leading-6 max-h-32"
            style={{ 
              minHeight: '24px',
              height: 'auto'
            }}
            onInput={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px';
            }}
          />
          
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-lg transition-colors duration-200 ${
                showSettings 
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              title="Settings"
            >
              <SettingsIcon size={16} />
            </button>
            
            <button
              type="submit"
              disabled={disabled || !message.trim()}
              className="p-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed text-gray-600 dark:text-gray-300 disabled:text-gray-400 dark:disabled:text-gray-500 rounded-lg transition-colors duration-200"
              title="Send message"
            >
              <SendIcon size={16} />
            </button>
          </div>
        </div>
      </form>

      {/* Hints */}
      <div className="flex justify-center items-center mt-2 text-xs text-gray-500 dark:text-gray-400">
        <span>Press Enter to send, Shift+Enter for new line</span>
      </div>
    </div>
  );
};

export default ChatInput;