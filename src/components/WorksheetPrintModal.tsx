'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface WorksheetPrintModalProps {
  content: string;
  agentName?: string;
  onClose: () => void;
}

export default function WorksheetPrintModal({
  content,
  agentName = 'PrintWiz',
  onClose,
}: WorksheetPrintModalProps) {
  const [showAnswerKey, setShowAnswerKey] = useState(true);
  const [copied, setCopied] = useState(false);

  // Common answer key dividers used across agents
  const answerKeyDividers = [
    '--- [ANSWER KEY] ---',
    '--- ANSWER KEY ---',
    '### 🔑 TEACHER & PARENT ANSWER KEY',
    '### 🔑 TEACHER & PARENT ANSWER KEY (Detach or Fold Before Giving to Student)',
    '### Teacher & Parent Answer Key',
    '## Teacher & Parent Answer Key',
    '### Answer Key',
    '## Answer Key',
    '**Answer Key**',
    '### Answers',
    '## Answers',
  ];

  let mainContent = content;
  let answerKeyContent = '';

  for (const divider of answerKeyDividers) {
    if (content.includes(divider)) {
      const parts = content.split(divider);
      mainContent = parts[0];
      answerKeyContent = parts.slice(1).join(divider);
      break;
    }
  }

  const hasAnswerKey = Boolean(answerKeyContent.trim());

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = async () => {
    try {
      const copyText = showAnswerKey ? content : mainContent;
      await navigator.clipboard.writeText(copyText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-2xl w-full max-w-4xl max-h-[95vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Toolbar — hidden on print */}
        <div className="no-print flex items-center justify-between px-5 py-3.5 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950/90 gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-600 dark:text-blue-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            </div>
            <div>
              <h2 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-gray-100 flex items-center gap-2">
                Worksheet Print Studio
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-300">
                  {agentName}
                </span>
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
                Formatted for A4/Letter · PDF Ready
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap ml-auto">
            {/* Answer Key Toggle */}
            {hasAnswerKey && (
              <button
                type="button"
                onClick={() => setShowAnswerKey(!showAnswerKey)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border transition-all ${
                  showAnswerKey
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-500/25'
                    : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
                title="Toggle Answer Key visibility"
              >
                {showAnswerKey ? '👁️‍🗨️' : '👁️'}{' '}
                <span>{showAnswerKey ? 'Hide Answer Key' : 'Show Answer Key'}</span>
              </button>
            )}

            {/* Copy */}
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            >
              {copied ? '✓ Copied' : '📋 Copy Text'}
            </button>

            {/* Print */}
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/25 transition active:scale-95"
            >
              🖨️ Print / Save PDF
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-900 dark:hover:text-white transition"
              aria-label="Close print preview"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        {/* Printable content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 bg-white text-gray-900 worksheet-printable-area">
          {/* Student header */}
          <div className="border-b-2 border-gray-900 pb-4 mb-6">
            <div className="flex flex-wrap items-center justify-between text-sm font-semibold gap-4 text-gray-900 mb-2">
              <div>
                Name: <span className="inline-block border-b-2 border-dotted border-gray-700 w-44 sm:w-60 ml-1" />
              </div>
              <div>
                Date: <span className="inline-block border-b-2 border-dotted border-gray-700 w-28 sm:w-36 ml-1" />
              </div>
              <div>
                Score: <span className="inline-block border-b-2 border-dotted border-gray-700 w-20 ml-1" />
              </div>
            </div>
          </div>

          {/* Main worksheet body */}
          <div className="prose prose-gray max-w-none text-gray-950 leading-relaxed font-sans">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{mainContent}</ReactMarkdown>

            {/* Answer Key */}
            {hasAnswerKey && showAnswerKey && (
              <div className="worksheet-page-break mt-12 pt-8 border-t-2 border-dashed border-gray-400">
                <div className="text-center font-bold text-base text-gray-700 uppercase tracking-widest mb-4">
                  — Teacher / Parent Answer Key —
                </div>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{answerKeyContent}</ReactMarkdown>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
