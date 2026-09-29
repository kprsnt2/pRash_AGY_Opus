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
  chats: ChatSession[];
}

export default function ChatArea({ chatId, agentId, privacyMode, onUpdateChat, onNewChatCreated, chats }: ChatAreaProps) {
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

  // Detect agent switches in message history
  let lastAgentId: string | undefined;

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Main chat area — full height, no redundant header */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6" ref={scrollRef}>
        {messages.length === 0 ? (
          /* Empty state — agent welcome */
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
          /* Chat messages */
          <div className="max-w-4xl mx-auto space-y-6 pb-20">
            {messages.map((msg, idx) => {
              // Show agent switch divider if agent changed mid-chat
              const msgAgentId = msg.agentId || agentId;
              const showDivider = lastAgentId && msgAgentId !== lastAgentId && msg.role === 'assistant';
              lastAgentId = msg.role === 'assistant' ? msgAgentId : lastAgentId;

              const switchedAgent = showDivider ? getAgent(msgAgentId) : null;

              return (
                <React.Fragment key={msg.id}>
                  {showDivider && switchedAgent && (
                    <div className="flex items-center gap-3 py-2">
                      <div className="flex-1 h-px bg-gray-300 dark:bg-gray-700" />
                      <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        🔄 Switched to <span className="font-medium">{switchedAgent.icon} {switchedAgent.name}</span>
                      </span>
                      <div className="flex-1 h-px bg-gray-300 dark:bg-gray-700" />
                    </div>
                  )}
                  <ChatMessage message={msg} agentId={msgAgentId} />
                </React.Fragment>
              );
            })}
          </div>
        )}
      </div>

      {error && (
        <div className="p-3 mx-4 mb-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800 rounded-lg text-sm text-center">
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
