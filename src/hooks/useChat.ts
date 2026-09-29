'use client'

import { useState, useRef, useEffect } from 'react';
import { Message, FileAttachment, FallbackAttempt } from '@/lib/types';

interface UseChatOptions {
  chatId: string | null;
  agentId: string;
  privacyMode: boolean;
  onUpdateChat: (chatId: string, messages: Message[], title?: string) => void;
  onNewChatCreated: (chatId: string) => void;
}

export interface UseChatReturn {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  isLoading: boolean;
  error: string | null;
  currentModel: string | null;
  sendMessage: (content: string, attachments?: FileAttachment[]) => Promise<void>;
  stopGenerating: () => void;
}

/** Rough token estimate: ~1.3 tokens per word */
function estimateTokens(text: string): number {
  return Math.round(text.split(/\s+/).length * 1.3);
}

export function useChat({ agentId, privacyMode, onUpdateChat, onNewChatCreated, chatId }: UseChatOptions): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentModel, setCurrentModel] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const chatIdRef = useRef<string | null>(chatId);

  useEffect(() => {
    chatIdRef.current = chatId;
  }, [chatId]);

  const sendMessage = async (content: string, attachments?: FileAttachment[]) => {
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      attachments: attachments && attachments.length > 0 ? attachments : undefined,
      agentId,
      timestamp: Date.now(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsLoading(true);
    setError(null);

    let activeChatId = chatIdRef.current;
    if (!activeChatId) {
      activeChatId = crypto.randomUUID();
      chatIdRef.current = activeChatId;
      onNewChatCreated(activeChatId);
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    const sendStart = Date.now();

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({
            role: m.role,
            content: m.content,
            attachments: m.attachments,
          })),
          agentId,
          privacyMode,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        // Try to parse error response
        let errorMsg = `API error: ${response.status}`;
        try {
          const errBody = await response.json();
          if (errBody.message) errorMsg = errBody.message;
          if (errBody.fallbackChain) {
            const failedProviders = errBody.fallbackChain
              .filter((f: FallbackAttempt) => !f.success)
              .map((f: FallbackAttempt) => `${f.provider}: ${f.error}`)
              .join(', ');
            if (failedProviders) errorMsg += ` (${failedProviders})`;
          }
        } catch { /* ignore */ }
        throw new Error(errorMsg);
      }

      const modelUsed = response.headers.get('X-Model-Used') || 'Unknown';
      const providerUsed = response.headers.get('X-Provider') || '';
      const serverTime = response.headers.get('X-Response-Time');
      let fallbackChain: FallbackAttempt[] = [];
      try {
        const chainStr = response.headers.get('X-Fallback-Chain');
        if (chainStr) fallbackChain = JSON.parse(chainStr);
      } catch { /* ignore */ }

      setCurrentModel(modelUsed);

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: '',
        model: modelUsed,
        provider: providerUsed,
        agentId,
        timestamp: Date.now(),
        fallbackChain: fallbackChain.length > 0 ? fallbackChain : undefined,
      };

      const newMessages = [...updatedMessages, assistantMessage];
      setMessages(newMessages);

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        fullContent += text;

        setMessages(prev => {
          const updated = [...prev];
          const lastIdx = updated.length - 1;
          updated[lastIdx] = { ...updated[lastIdx], content: fullContent };
          return updated;
        });
      }

      const responseTime = Date.now() - sendStart;
      const tokenEstimate = estimateTokens(fullContent);

      const finalMessage: Message = {
        ...assistantMessage,
        content: fullContent,
        responseTime,
        tokenEstimate,
      };
      const finalMessages = [...updatedMessages, finalMessage];

      setMessages(finalMessages);

      const title = updatedMessages.length <= 1
        ? content.slice(0, 50) + (content.length > 50 ? '...' : '')
        : undefined;
      onUpdateChat(activeChatId, finalMessages, title);

    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Something went wrong');
        setMessages(updatedMessages);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const stopGenerating = () => {
    abortControllerRef.current?.abort();
    setIsLoading(false);
  };

  return { messages, setMessages, isLoading, error, currentModel, sendMessage, stopGenerating };
}
