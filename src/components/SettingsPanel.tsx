'use client'
import React from 'react';
import { CANONICAL_MODELS, PROVIDER_LABELS } from '@/lib/models';
import { ModelProvider } from '@/lib/types';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  privacyMode: boolean;
  onTogglePrivacy: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export default function SettingsPanel({
  isOpen,
  onClose,
  privacyMode,
  onTogglePrivacy,
  darkMode,
  onToggleDarkMode
}: SettingsPanelProps) {

  const handleLogout = () => {
    window.dispatchEvent(new Event('logout'));
    onClose();
  };

  const handleClearChats = () => {
    if (confirm('Are you sure you want to delete all chats? This cannot be undone.')) {
      window.dispatchEvent(new Event('clearChats'));
      onClose();
    }
  };

  const providers: ModelProvider[] = ['openai', 'google', 'groq', 'nvidia'];

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 shadow-2xl flex flex-col transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Settings</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-8">

          {/* Appearance & Privacy */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Appearance & Privacy</h3>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-800 dark:text-gray-200">Dark Mode</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Toggle dark theme.</p>
              </div>
              <button
                onClick={onToggleDarkMode}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${darkMode ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${darkMode ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
              <div className="pr-4">
                <p className="font-medium text-emerald-600 dark:text-emerald-400">Privacy Mode</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight mt-1">Route all requests through Gemini only. No data shared with OpenAI.</p>
              </div>
              <button
                onClick={onTogglePrivacy}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${privacyMode ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${privacyMode ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>

          {/* Model Configuration */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Model Configuration</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Models auto-route in order. Override via environment variables.
            </p>

            <div className="space-y-3">
              {providers.map((provider, idx) => {
                const label = PROVIDER_LABELS[provider];
                const model = CANONICAL_MODELS[provider];
                return (
                  <div key={provider} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                    <span className="text-xs font-bold text-gray-400 w-5">{idx + 1}.</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${label.color}`}>
                          {label.badge}
                        </span>
                        {idx === 0 && <span className="text-[10px] text-blue-500 font-medium">PRIMARY</span>}
                        {idx === 1 && <span className="text-[10px] text-gray-500 font-medium">BACKUP</span>}
                        {idx > 1 && <span className="text-[10px] text-gray-500 font-medium">FALLBACK</span>}
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 font-mono truncate">{model}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-tight">
              Override models via <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded text-[10px]">OPENAI_MODEL</code>,{' '}
              <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded text-[10px]">GOOGLE_MODEL</code>,{' '}
              <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded text-[10px]">GROQ_MODEL</code>,{' '}
              <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded text-[10px]">NVIDIA_MODEL</code> in{' '}
              <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded text-[10px]">.env</code>
            </p>
          </div>

          {/* About */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">About</h3>
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
              <p className="font-bold mb-1 text-gray-900 dark:text-gray-100">🏠 pRash Hub</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">All-in-one AI Chat Hub — Ultimate Edition</p>
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <span className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">Version 2.0.0</span>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Features</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                '🔐 Password Auth',
                '🔄 Auto-Routing',
                '📦 Export/Import',
                '🖨️ Print Worksheets',
                '🎤 Voice Input',
                '🔊 Read Aloud',
                '🌙 Dark/Light Mode',
                '📊 Chat Stats',
                '🔒 Privacy Mode',
                '📎 File Attachments',
              ].map((feature) => (
                <div key={feature} className="flex items-center gap-1.5 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Danger Zone */}
          <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-800">
            <h3 className="text-sm font-semibold text-red-500 uppercase tracking-wider">Danger Zone</h3>

            <button
              onClick={handleClearChats}
              className="w-full text-left px-4 py-3 rounded-lg border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm font-medium"
            >
              Clear All Chats
            </button>

            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors text-sm font-medium"
            >
              Log Out
            </button>
          </div>

        </div>
      </div>
    </>
  );
}
