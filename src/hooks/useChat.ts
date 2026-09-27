'use client'

import { useState, useRef, useEffect } from 'react';
import { Message, FileAttachment } from '@/lib/types';

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

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content, attachments: m.attachments })),
          agentId,
          privacyMode,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const modelUsed = response.headers.get('X-Model-Used') || 'Unknown';
      setCurrentModel(modelUsed);

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: '',
        model: modelUsed,
        timestamp: Date.now(),
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

      const finalMessages = [...updatedMessages, { ...assistantMessage, content: fullContent }];
      const title = updatedMessages.length <= 1 ? content.slice(0, 50) + (content.length > 50 ? '...' : '') : undefined;
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
