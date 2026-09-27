'use client'

import React from 'react';
import { Message } from '@/lib/types';
import { getAgent } from '@/lib/agents';
import MarkdownRenderer from './MarkdownRenderer';

interface ChatMessageProps {
  message: Message;
  agentId: string;
}

export default function ChatMessage({ message, agentId }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const agent = getAgent(agentId);

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}>
      <div className={`flex max-w-[90%] md:max-w-[80%] gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        {!isUser && (
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-lg shadow-sm">
            {agent?.icon || '🤖'}
          </div>
        )}

        {/* Message Content */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1`}>
          <div className={`px-4 py-3 shadow-sm ${
            isUser 
              ? 'bg-blue-600 text-white rounded-2xl rounded-tr-md' 
              : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-2xl rounded-tl-md border border-gray-100 dark:border-gray-700'
          }`}>
            
            {/* Attachments */}
            {message.attachments && message.attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {message.attachments.map((file) => (
                  <div key={file.id} className="relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900">
                    {file.type.startsWith('image/') ? (
                      <img src={file.dataUrl} alt={file.name} className="h-32 w-auto object-contain" />
                    ) : (
                      <div className="flex items-center gap-2 p-2">
                        <span className="text-xl">📄</span>
                        <span className="text-sm truncate max-w-[150px]">{file.name}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Text content */}
            <div className={`prose dark:prose-invert max-w-none ${isUser ? 'text-white' : ''}`}>
              {isUser ? (
                <div className="whitespace-pre-wrap font-sans">{message.content}</div>
              ) : (
                <MarkdownRenderer content={message.content} />
              )}
            </div>
          </div>
          
          {/* Footer info (Timestamp & Model) */}
          <div className="flex items-center gap-2 px-1 text-xs text-gray-500 dark:text-gray-400">
            <span>{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            {!isUser && message.model && (
              <>
                <span>•</span>
                <span className="font-mono">{message.model}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
