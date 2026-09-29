'use client'

import React, { useState } from 'react';
import { Message } from '@/lib/types';
import { getAgent } from '@/lib/agents';
import { speakText, cancelSpeech, isSpeechSynthesisSupported } from '@/lib/speech';
import MarkdownRenderer from './MarkdownRenderer';
import WorksheetPrintModal from './WorksheetPrintModal';

interface ChatMessageProps {
  message: Message;
  agentId: string;
}

/** Agents whose output can be printed as worksheets */
const PRINTABLE_AGENTS = ['printwiz', 'numberninja', 'brainspark'];
const PRINTABLE_KEYWORDS = ['Answer Key', 'Student Name', 'Score:', 'Worksheet', '--- [ANSWER KEY] ---'];

function isPrintable(message: Message, agentId: string): boolean {
  if (message.role !== 'assistant') return false;
  if (PRINTABLE_AGENTS.includes(agentId)) return true;
  return PRINTABLE_KEYWORDS.some(kw => message.content.includes(kw));
}

export default function ChatMessage({ message, agentId }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const agent = getAgent(agentId);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showPrint, setShowPrint] = useState(false);
  const ttsSupported = typeof window !== 'undefined' && isSpeechSynthesisSupported();
  const canPrint = isPrintable(message, agentId);

  const handleToggleTTS = () => {
    if (isSpeaking) {
      cancelSpeech();
      setIsSpeaking(false);
    } else {
      const started = speakText(message.content, {
        onEnd: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
      if (started) setIsSpeaking(true);
    }
  };

  // Format response time
  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <>
      <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}>
        <div className={`flex max-w-[90%] md:max-w-[80%] gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          {/* Avatar */}
          {!isUser && (
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-lg shadow-sm">
              {agent?.icon || '🤖'}
            </div>
          )}

          {/* Message content */}
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

            {/* Action buttons for assistant messages */}
            {!isUser && message.content && (
              <div className="flex items-center gap-1 px-1">
                {/* TTS button */}
                {ttsSupported && (
                  <button
                    onClick={handleToggleTTS}
                    className={`p-1 rounded-md text-xs transition-colors ${
                      isSpeaking
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                        : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                    title={isSpeaking ? 'Stop reading' : 'Read aloud'}
                  >
                    {isSpeaking ? '⏹ Stop' : '🔊 Listen'}
                  </button>
                )}

                {/* Print button */}
                {canPrint && (
                  <button
                    onClick={() => setShowPrint(true)}
                    className="p-1 rounded-md text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    title="Print worksheet"
                  >
                    🖨️ Print
                  </button>
                )}
              </div>
            )}

            {/* Footer: timestamp, model, stats */}
            <div className="flex items-center gap-2 px-1 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
              <span>{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>

              {!isUser && message.model && (
                <>
                  <span>•</span>
                  <span className="font-mono text-[11px]">{message.model}</span>
                </>
              )}

              {!isUser && message.responseTime && (
                <>
                  <span>•</span>
                  <span>⚡ {formatTime(message.responseTime)}</span>
                </>
              )}

              {!isUser && message.tokenEstimate && (
                <>
                  <span>•</span>
                  <span>~{message.tokenEstimate} tokens</span>
                </>
              )}

              {/* Fallback indicator */}
              {!isUser && message.fallbackChain && message.fallbackChain.length > 1 && (
                <>
                  <span>•</span>
                  <span className="text-amber-500 dark:text-amber-400" title={
                    message.fallbackChain
                      .filter(f => !f.success)
                      .map(f => `${f.provider}: ${f.error}`)
                      .join(', ')
                  }>
                    🔄 Auto-routed ({message.fallbackChain.filter(f => !f.success).length} failed)
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Print modal */}
      {showPrint && (
        <WorksheetPrintModal
          content={message.content}
          agentName={agent?.name || 'PrintWiz'}
          onClose={() => setShowPrint(false)}
        />
      )}
    </>
  );
}
