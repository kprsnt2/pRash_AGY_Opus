'use client'

import React from 'react';
import { FileAttachment } from '@/lib/types';

interface FilePreviewProps {
  files: FileAttachment[];
  onRemove: (id: string) => void;
}

export default function FilePreview({ files, onRemove }: FilePreviewProps) {
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  return (
    <div className="flex gap-3 overflow-x-auto py-2 px-1 custom-scrollbar">
      {files.map((file) => (
        <div key={file.id} className="relative flex-shrink-0 group animate-fade-in">
          <button
            onClick={() => onRemove(file.id)}
            className="absolute -top-2 -right-2 z-10 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
            title="Remove file"
          >
            ✕
          </button>

          <div className="w-20 h-20 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm flex flex-col items-center justify-center relative">
            {file.type.startsWith('image/') ? (
              <img src={file.dataUrl} alt={file.name} className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center justify-center p-2 text-center h-full">
                <span className="text-2xl mb-1">📄</span>
                <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium truncate w-full">
                  {file.name.split('.').pop()?.toUpperCase() || 'FILE'}
                </span>
              </div>
            )}
          </div>
          <div className="w-20 mt-1">
            <p className="text-xs text-gray-600 dark:text-gray-300 truncate" title={file.name}>
              {file.name}
            </p>
            <p className="text-[10px] text-gray-400 dark:text-gray-500">
              {formatSize(file.size)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
