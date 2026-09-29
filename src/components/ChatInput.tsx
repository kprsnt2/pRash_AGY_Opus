'use client'

import React, { useState, useRef, useEffect } from 'react';
import { FileAttachment } from '@/lib/types';
import { useSpeechRecognition, isSpeechRecognitionSupported } from '@/hooks/useSpeechRecognition';
import FilePreview from './FilePreview';

interface ChatInputProps {
  onSend: (content: string, attachments?: FileAttachment[]) => void;
  isLoading: boolean;
  onStop: () => void;
  supportsFiles: boolean;
}

export default function ChatInput({ onSend, isLoading, onStop, supportsFiles }: ChatInputProps) {
  const [content, setContent] = useState('');
  const [pendingFiles, setPendingFiles] = useState<FileAttachment[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Voice input
  const voiceSupported = typeof window !== 'undefined' && isSpeechRecognitionSupported();
  const { isListening, startListening, stopListening, resetTranscript } = useSpeechRecognition({
    onResult: (transcript, isFinal) => {
      if (isFinal) {
        setContent(prev => {
          const separator = prev.trim() ? ' ' : '';
          return prev + separator + transcript;
        });
      }
    },
  });

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + 'px';
    }
  }, [content]);

  const handleSend = () => {
    if ((!content.trim() && pendingFiles.length === 0) || isLoading) return;

    // Stop listening if voice is active
    if (isListening) {
      stopListening();
      resetTranscript();
    }

    onSend(content.trim(), pendingFiles.length > 0 ? pendingFiles : undefined);
    setContent('');
    setPendingFiles([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const attachment: FileAttachment = {
          id: crypto.randomUUID(),
          name: file.name,
          type: file.type,
          size: file.size,
          dataUrl: e.target!.result as string,
        };
        setPendingFiles(prev => [...prev, attachment]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (supportsFiles) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (supportsFiles && e.dataTransfer.files) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const handleMicToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      resetTranscript();
      startListening();
    }
  };

  const canSend = (content.trim().length > 0 || pendingFiles.length > 0) && !isLoading;

  return (
    <div className="relative">
      {pendingFiles.length > 0 && (
        <div className="mb-3">
          <FilePreview
            files={pendingFiles}
            onRemove={(id) => setPendingFiles(prev => prev.filter(f => f.id !== id))}
          />
        </div>
      )}

      <div
        className={`relative flex items-end gap-2 bg-white dark:bg-gray-800 border ${isDragging ? 'border-blue-500 border-dashed bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-700'} rounded-xl shadow-inner p-2 transition-colors`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isDragging && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-800/80 rounded-xl z-10">
            <span className="text-blue-500 font-semibold pointer-events-none">Drop files to attach</span>
          </div>
        )}

        {/* File attach button */}
        {supportsFiles && (
          <>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              title="Attach file"
              disabled={isLoading}
            >
              📎
            </button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              multiple
              accept="image/*,.pdf,.doc,.docx,.txt,.csv,.xlsx"
              onChange={(e) => handleFileSelect(e.target.files)}
            />
          </>
        )}

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isListening ? '🎤 Listening...' : supportsFiles ? 'Type a message or drop files...' : 'Type a message...'}
          className="flex-1 max-h-32 bg-transparent text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 resize-none outline-none py-2 px-1"
          rows={1}
          disabled={isLoading}
        />

        {/* Mic button */}
        {voiceSupported && (
          <button
            onClick={handleMicToggle}
            className={`p-2 rounded-lg transition-all ${
              isListening
                ? 'bg-red-500 text-white animate-mic-pulse'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            title={isListening ? 'Stop listening' : 'Start voice input'}
            disabled={isLoading}
          >
            {isListening ? '⏹' : '🎤'}
          </button>
        )}

        {/* Send / Stop button */}
        {isLoading ? (
          <button
            onClick={onStop}
            className="p-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition-colors"
            title="Stop generating"
          >
            ⏹
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={!canSend}
            className={`p-2 rounded-lg transition-colors ${
              canSend
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
            }`}
            title="Send message"
          >
            ➤
          </button>
        )}
      </div>
    </div>
  );
}
