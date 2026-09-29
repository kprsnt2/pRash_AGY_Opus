'use client'

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';

interface MarkdownRendererProps {
  content: string;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeHighlight]}
      components={{
        pre: ({ node, children, ...props }) => {
          return (
            <div className="relative group my-4 rounded-lg overflow-hidden border border-gray-700 bg-[#0d1117]">
              <pre {...props} className="p-4 overflow-x-auto text-sm !bg-transparent !m-0">
                {children}
              </pre>
            </div>
          );
        },
        code: ({ node, className, children, ...props }) => {
          const match = /language-(\w+)/.exec(className || '');
          const isInline = !match;

          if (isInline) {
            return (
              <code className="bg-gray-200 dark:bg-gray-700 text-pink-500 dark:text-pink-400 px-1.5 py-0.5 rounded text-sm" {...props}>
                {children}
              </code>
            );
          }

          const language = match?.[1] || 'text';
          const codeString = String(children).replace(/\n$/, '');

          return (
            <>
              <div className="flex items-center justify-between px-4 py-1.5 bg-gray-800 text-gray-400 text-xs font-mono border-b border-gray-700">
                <span>{language}</span>
                <CopyButton text={codeString} />
              </div>
              <code className={className} {...props}>
                {children}
              </code>
            </>
          );
        },
        a: ({ node, children, href, ...props }) => (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline" {...props}>
            {children}
          </a>
        ),
        table: ({ node, children, ...props }) => (
          <div className="overflow-x-auto my-4">
            <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700 border border-gray-300 dark:border-gray-700 rounded-lg" {...props}>
              {children}
            </table>
          </div>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="text-gray-400 hover:text-white transition-colors flex items-center gap-1"
      title="Copy code"
    >
      {copied ? (
        <><span>✓</span> Copied!</>
      ) : (
        <><span>📋</span> Copy</>
      )}
    </button>
  );
}
