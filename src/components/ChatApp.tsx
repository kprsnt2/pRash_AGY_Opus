'use client'
import React, { useState, useEffect } from 'react';
import { agents, getAgent } from '@/lib/agents';
import { saveChats, loadChats, saveSettings, loadSettings, saveAuthToken, loadAuthToken, clearAuthToken } from '@/lib/storage';
import { ChatSession, Message } from '@/lib/types';
import Sidebar from '@/components/Sidebar';
import AgentSelector from '@/components/AgentSelector';
import SettingsPanel from '@/components/SettingsPanel';
import ChatArea from '@/components/ChatArea';

export default function ChatApp() {
  const [authenticated, setAuthenticated] = useState(false);
  const [privacyMode, setPrivacyMode] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [currentAgentId, setCurrentAgentId] = useState('jarvis');
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showAgentSelector, setShowAgentSelector] = useState(false);
  
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    const settings = loadSettings();
    if (settings) {
      if (settings.privacyMode !== undefined) setPrivacyMode(settings.privacyMode);
      if (settings.darkMode !== undefined) {
        setDarkMode(settings.darkMode);
        if (settings.darkMode) {
          document.documentElement.classList.add('dark');
          document.documentElement.classList.remove('light');
        } else {
          document.documentElement.classList.add('light');
          document.documentElement.classList.remove('dark');
        }
      }
    }
    
    const loadedChats = loadChats();
    if (loadedChats) setChats(loadedChats);
    
    const token = loadAuthToken();
    if (token) setAuthenticated(true);
    
    const handleLogout = () => {
      clearAuthToken();
      setAuthenticated(false);
    };
    
    const handleClearChats = () => {
      setChats([]);
      saveChats([]);
      setCurrentChatId(null);
    };
    
    window.addEventListener('logout', handleLogout);
    window.addEventListener('clearChats', handleClearChats);
    return () => {
      window.removeEventListener('logout', handleLogout);
      window.removeEventListener('clearChats', handleClearChats);
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      if (res.ok) {
        const data = await res.json();
        saveAuthToken(data.token || 'dummy_token');
        setAuthenticated(true);
      } else {
        setLoginError('Invalid password');
      }
    } catch (err) {
      setLoginError('Login failed');
    }
  };

  const handleNewChat = () => {
    setCurrentChatId(null);
  };

  const handleSelectChat = (id: string) => {
    setCurrentChatId(id);
    const chat = chats.find(c => c.id === id);
    if (chat) setCurrentAgentId(chat.agentId);
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  const handleDeleteChat = (id: string) => {
    const newChats = chats.filter(c => c.id !== id);
    setChats(newChats);
    saveChats(newChats);
    if (currentChatId === id) setCurrentChatId(null);
  };

  const handleSelectAgent = (id: string) => {
    setCurrentAgentId(id);
    setShowAgentSelector(false);
    handleNewChat();
  };

  const handleUpdateChat = (chatId: string, messages: Message[], title?: string) => {
    setChats(prev => {
      const existing = prev.find(c => c.id === chatId);
      let newChats;
      if (existing) {
        newChats = prev.map(c => c.id === chatId ? { ...c, messages, updatedAt: Date.now(), ...(title ? { title } : {}) } : c);
      } else {
        const newChat: ChatSession = {
          id: chatId,
          title: title || 'New Chat',
          agentId: currentAgentId,
          messages,
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        newChats = [newChat, ...prev];
      }
      saveChats(newChats);
      return newChats;
    });
  };

  const handleNewChatCreated = (chatId: string) => {
    setCurrentChatId(chatId);
  };

  const handleTogglePrivacy = () => {
    const newPrivacy = !privacyMode;
    setPrivacyMode(newPrivacy);
    saveSettings({ privacyMode: newPrivacy, darkMode });
  };

  const handleToggleDarkMode = () => {
    const newDark = !darkMode;
    setDarkMode(newDark);
    saveSettings({ privacyMode, darkMode: newDark });
    if (newDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  };

  const currentAgent = getAgent(currentAgentId);

  if (!authenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950 p-4">
        <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-xl shadow-2xl p-8">
          <h1 className="text-3xl font-bold text-center text-white mb-8">🏠 pRash Hub</h1>
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors"
              />
              {loginError && <p className="text-red-400 text-sm mt-2">{loginError}</p>}
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg px-4 py-3 transition-colors"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-950 text-gray-100">
      <Sidebar
        chats={chats}
        currentChatId={currentChatId}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        currentAgentId={currentAgentId}
        onSelectAgent={() => setShowAgentSelector(true)}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        privacyMode={privacyMode}
        onTogglePrivacy={handleTogglePrivacy}
        onOpenSettings={() => setShowSettings(true)}
      />

      <div className="flex-1 flex flex-col h-full relative w-full">
        <div className="h-14 border-b border-gray-800 flex items-center justify-between px-4 bg-gray-900/50 backdrop-blur">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-800 md:hidden"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <div 
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-800 cursor-pointer transition-colors"
              onClick={() => setShowAgentSelector(true)}
            >
              <span className="text-xl">{currentAgent?.icon || '🤖'}</span>
              <span className="font-medium hidden sm:block">{currentAgent?.name || 'Agent'}</span>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {privacyMode && (
              <span className="flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-full">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                <span className="hidden sm:inline">Private</span>
              </span>
            )}
            <button 
              onClick={() => setShowSettings(true)}
              className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-gray-200 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden relative">
          <ChatArea 
            chatId={currentChatId}
            agentId={currentAgentId}
            privacyMode={privacyMode}
            onUpdateChat={handleUpdateChat}
            onNewChatCreated={handleNewChatCreated}
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            chats={chats}
          />
        </div>
      </div>

      {showAgentSelector && (
        <AgentSelector 
          currentAgentId={currentAgentId}
          onSelectAgent={handleSelectAgent}
          onClose={() => setShowAgentSelector(false)}
        />
      )}

      <SettingsPanel
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        privacyMode={privacyMode}
        onTogglePrivacy={handleTogglePrivacy}
        darkMode={darkMode}
        onToggleDarkMode={handleToggleDarkMode}
      />
    </div>
  );
}
