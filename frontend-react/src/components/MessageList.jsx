import React, { useState } from 'react';
import { UserIcon, BotIcon, ThumbsUpIcon, ThumbsDownIcon, ExternalLinkIcon, CopyIcon, CheckIcon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const MessageList = ({ messages, onFeedback, isTyping }) => {
  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {messages.map((message, index) => (
        <Message 
          key={message.id || index} 
          message={message} 
          onFeedback={onFeedback}
        />
      ))}
      
      {isTyping && <TypingIndicator />}
    </div>
  );
};

const Message = ({ message, onFeedback }) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const { isDark } = useTheme();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  return (
    <div className="group mb-6">
      <div className="flex gap-4 items-start">
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
          isUser 
            ? 'bg-blue-600 text-white' 
            : 'bg-green-600 text-white'
        }`}>
          {isUser ? 'U' : 'AI'}
        </div>

        {/* Message Content */}
        <div className="flex-1 min-w-0">
          <div className="text-gray-900 dark:text-gray-100 leading-relaxed">
            <MessageContent content={message.content} />
          </div>

          {/* Sources */}
          {!isUser && message.sources && message.sources.length > 0 && (
            <div className="mt-4">
              <Sources sources={message.sources} />
            </div>
          )}

          {/* Feedback and Copy Buttons */}
          {!isUser && (
            <div className="mt-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors duration-200"
                title="Copy response"
              >
                {copied ? (
                  <>
                    <CheckIcon size={12} className="text-green-500" />
                    <span className="text-green-500">Copied!</span>
                  </>
                ) : (
                  <>
                    <CopyIcon size={12} />
                    <span>Copy</span>
                  </>
                )}
              </button>
              
              <FeedbackButton
                type="like"
                active={message.feedback === 'like'}
                onClick={() => onFeedback(message.id, 'like')}
              />
              <FeedbackButton
                type="dislike"
                active={message.feedback === 'dislike'}
                onClick={() => onFeedback(message.id, 'dislike')}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const MessageContent = ({ content }) => {
  // Simple markdown-like formatting
  const formatContent = (text) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm">$1</code>')
      .replace(/\n/g, '<br/>');
  };

  return (
    <div 
      className="prose prose-gray dark:prose-invert max-w-none"
      dangerouslySetInnerHTML={{ __html: formatContent(content) }}
    />
  );
};

const Sources = ({ sources }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (sources.length === 0) return null;

  return (
    <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200 flex items-center justify-between group"
      >
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Sources ({sources.length})
        </span>
        <div className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-gray-400">
            <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </button>
      
      {isExpanded && (
        <div className="px-3 pb-3 space-y-2 border-t border-gray-200 dark:border-gray-700">
          {sources.map((source, index) => (
            <div key={index} className="text-sm bg-gray-100 dark:bg-gray-700 rounded p-3">
              <div className="flex items-start gap-2 mb-2">
                <ExternalLinkIcon size={14} className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-blue-600 dark:text-blue-400 truncate">
                    {source.source ? (
                      <a 
                        href={source.source}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        {source.source}
                      </a>
                    ) : (
                      `Source ${index + 1}`
                    )}
                  </div>
                  {source.content && (
                    <div className="text-xs text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                      {source.content.length > 150 
                        ? `${source.content.substring(0, 150)}...` 
                        : source.content
                      }
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const FeedbackButton = ({ type, active, onClick }) => {
  const Icon = type === 'like' ? ThumbsUpIcon : ThumbsDownIcon;

  return (
    <button
      onClick={onClick}
      className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 ${
        active 
          ? (type === 'like' ? 'text-green-600' : 'text-red-600')
          : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
      }`}
      title={type === 'like' ? 'Like this response' : 'Dislike this response'}
    >
      <Icon size={14} />
    </button>
  );
};

const TypingIndicator = () => (
  <div className="flex gap-4 items-start mb-6">
    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-sm font-semibold text-white">
      AI
    </div>
    <div className="flex-1">
      <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
        <div className="flex gap-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
        </div>
        <span className="text-sm ml-2">AI is thinking...</span>
      </div>
    </div>
  </div>
);

export default MessageList;