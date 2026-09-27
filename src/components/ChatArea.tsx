'use client'

import React, { useEffect, useRef } from 'react';
import { useChat } from '@/hooks/useChat';
import { Message, ChatSession } from '@/lib/types';
import { getAgent } from '@/lib/agents';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';

interface ChatAreaProps {
  chatId: string | null;
  agentId: string;
  privacyMode: boolean;
  onUpdateChat: (chatId: string, messages: Message[], title?: string) => void;
  onNewChatCreated: (chatId: string) => void;
  onToggleSidebar: () => void;
  chats: ChatSession[];
}

export default function ChatArea({ chatId, agentId, privacyMode, onUpdateChat, onNewChatCreated, onToggleSidebar, chats }: ChatAreaProps) {
  const { messages, setMessages, isLoading, error, currentModel, sendMessage, stopGenerating } = useChat({
    chatId,
    agentId,
    privacyMode,
    onUpdateChat,
    onNewChatCreated,
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const agent = getAgent(agentId);

  useEffect(() => {
    if (chatId) {
      const chat = chats.find(c => c.id === chatId);
      if (chat) {
        setMessages(chat.messages);
      } else {
        setMessages([]);
      }
    } else {
      setMessages([]);
    }
  }, [chatId, chats, setMessages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (!agent) {
    return <div className="flex-1 flex items-center justify-center text-red-500">Agent not found</div>;
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Top bar */}
      <header className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <button onClick={onToggleSidebar} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg md:hidden">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xl">{agent.icon}</span>
            <h2 className="font-semibold text-gray-800 dark:text-gray-100">{agent.name}</h2>
            {currentModel && (
              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-full font-mono">
                {currentModel}
              </span>
            )}
            {privacyMode && <span title="Privacy Mode Enabled" className="text-sm text-gray-500">🔒</span>}
          </div>
        </div>
      </header>

      {/* Main chat area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto text-center space-y-6">
            <div className="text-6xl mb-4">{agent.icon}</div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">{agent.name}</h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg">{agent.description}</p>
            
            {agent.starters && agent.starters.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-8 w-full">
                {agent.starters.map((starter, idx) => (
                  <button
                    key={idx}
                    onClick={() => sendMessage(starter)}
                    className="p-4 text-left border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300"
                  >
                    {starter}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-6 pb-20">
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} agentId={agentId} />
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="p-3 mx-4 mb-2 bg-red-100 text-red-700 border border-red-300 rounded-lg text-sm text-center">
          {error}
        </div>
      )}

      {/* Input area */}
      <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto">
          <ChatInput
            onSend={sendMessage}
            isLoading={isLoading}
            onStop={stopGenerating}
            supportsFiles={agent.supportsFiles}
          />
        </div>
      </div>
    </div>
  );
}
