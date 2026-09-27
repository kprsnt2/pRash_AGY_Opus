'use client'
import React from 'react';
import { ChatSession } from '@/lib/types';
import { getAgent } from '@/lib/agents';

interface SidebarProps {
  chats: ChatSession[];
  currentChatId: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
  currentAgentId: string;
  onSelectAgent: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
  privacyMode: boolean;
  onTogglePrivacy: () => void;
  onOpenSettings: () => void;
}

export default function Sidebar({
  chats,
  currentChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  currentAgentId,
  onSelectAgent,
  isOpen,
  onClose,
  privacyMode,
  onTogglePrivacy,
  onOpenSettings
}: SidebarProps) {
  const currentAgent = getAgent(currentAgentId);

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}
      <div 
        className={`fixed md:static inset-y-0 left-0 z-30 w-72 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:hidden'}`}
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <h2 className="text-xl font-bold">🏠 pRash Hub</h2>
          <button onClick={onClose} className="md:hidden p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-4 space-y-4">
          <button 
            onClick={onNewChat}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-lg font-medium transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            New Chat
          </button>

          <div 
            onClick={() => onSelectAgent(currentAgentId)}
            className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors"
          >
            <span className="text-2xl">{currentAgent?.icon || '🤖'}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{currentAgent?.name || 'Select Agent'}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Current Agent</p>
            </div>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-gray-100 dark:bg-gray-800/50">
            <div className="flex items-center gap-2">
              <svg className={`w-4 h-4 ${privacyMode ? 'text-emerald-500' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
              <span className="text-sm font-medium">Privacy Mode</span>
            </div>
            <button 
              onClick={onTogglePrivacy}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${privacyMode ? 'bg-emerald-500' : 'bg-gray-400 dark:bg-gray-600'}`}
            >
              <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${privacyMode ? 'translate-x-5' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Recent Chats</p>
          {chats.map(chat => (
            <div 
              key={chat.id}
              onClick={() => onSelectChat(chat.id)}
              className={`group flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${currentChatId === chat.id ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' : 'hover:bg-gray-100 dark:hover:bg-gray-800 border border-transparent'}`}
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <span>{getAgent(chat.agentId)?.icon || '💬'}</span>
                <span className="text-sm truncate select-none">{chat.title}</span>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); onDeleteChat(chat.id); }}
                className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
          ))}
          {chats.length === 0 && (
            <div className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
              No chats yet
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <button 
            onClick={onOpenSettings}
            className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-sm font-medium transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            Settings
          </button>
        </div>
      </div>
    </>
  );
}
