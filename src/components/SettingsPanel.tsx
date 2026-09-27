'use client'
import React from 'react';

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

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}
      <div 
        className={`fixed inset-y-0 right-0 z-50 w-full sm:w-80 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 shadow-2xl flex flex-col transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <h2 className="text-xl font-bold">Settings</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-8">
          
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Appearance & Privacy</h3>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Dark Mode</p>
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

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">About</h3>
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
              <p className="font-bold mb-1">🏠 pRash Hub</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">All-in-one AI Chat Hub.</p>
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <span className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">Version 1.0.0</span>
              </div>
            </div>
          </div>

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
