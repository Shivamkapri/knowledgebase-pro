import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import { useChats } from './hooks/useChat';
import { ThemeProvider } from './contexts/ThemeContext';
import './index.css';

function App() {
  const [currentChatId, setCurrentChatId] = useState(null);
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const { chats, loading, error, createChat, deleteChat, refreshChats } = useChats();

  const handleNewChat = async () => {
    try {
      const newChat = await createChat();
      setCurrentChatId(newChat.id);
    } catch (err) {
      console.error('Failed to create chat:', err);
    }
  };

  const handleSelectChat = (chatId) => {
    setCurrentChatId(chatId);
  };

  const handleDeleteChat = async (chatId) => {
    try {
      await deleteChat(chatId);
      if (currentChatId === chatId) {
        setCurrentChatId(null);
      }
    } catch (err) {
      console.error('Failed to delete chat:', err);
    }
  };

  return (
    <ThemeProvider>
      <AppContent 
        chats={chats}
        currentChatId={currentChatId}
        isSidebarVisible={isSidebarVisible}
        loading={loading}
        error={error}
        handleNewChat={handleNewChat}
        handleSelectChat={handleSelectChat}
        handleDeleteChat={handleDeleteChat}
        setIsSidebarVisible={setIsSidebarVisible}
        refreshChats={refreshChats}
      />
    </ThemeProvider>
  );
}

function AppContent({ 
  chats, currentChatId, isSidebarVisible, loading, error, 
  handleNewChat, handleSelectChat, handleDeleteChat, 
  setIsSidebarVisible, refreshChats 
}) {
  return (
    <div className="flex h-screen bg-white dark:bg-gray-900 transition-colors duration-200">
      <Sidebar
        chats={chats}
        currentChatId={currentChatId}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        onDeleteChat={handleDeleteChat}
        loading={loading}
        error={error}
        isVisible={isSidebarVisible}
        onToggleVisibility={() => setIsSidebarVisible(!isSidebarVisible)}
      />
      <ChatArea
        chatId={currentChatId}
        onNewChat={handleNewChat}
        onChatTitleUpdate={refreshChats}
        onToggleSidebar={() => setIsSidebarVisible(!isSidebarVisible)}
        isSidebarVisible={isSidebarVisible}
      />
    </div>
  );
}

export default App;