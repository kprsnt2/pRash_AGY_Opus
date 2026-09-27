'use client'
import React, { useState } from 'react';
import { agents } from '@/lib/agents';

interface AgentSelectorProps {
  currentAgentId: string;
  onSelectAgent: (id: string) => void;
  onClose: () => void;
}

export default function AgentSelector({ currentAgentId, onSelectAgent, onClose }: AgentSelectorProps) {
  const [filter, setFilter] = useState<string>('All');
  const categories = ['All', 'personal', 'education', 'health', 'professional', 'creative'];

  const filteredAgents = filter === 'All' 
    ? agents 
    : agents.filter(a => a.category === filter);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-gray-200 dark:border-gray-800">
        
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <div>
            <h2 className="text-2xl font-bold">Select an Agent</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Choose an AI personality to chat with.</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-4 border-b border-gray-200 dark:border-gray-800 overflow-x-auto no-scrollbar">
          <div className="flex gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors capitalize ${filter === cat ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filteredAgents.map(agent => (
              <div 
                key={agent.id}
                onClick={() => onSelectAgent(agent.id)}
                className={`group cursor-pointer p-5 rounded-xl border-2 transition-all hover:-translate-y-1 ${currentAgentId === agent.id ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/10' : 'border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 hover:border-gray-300 dark:hover:border-gray-600'}`}
              >
                <div className="text-4xl mb-3">{agent.icon}</div>
                <h3 className="text-lg font-bold mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{agent.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{agent.description}</p>
                
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="text-xs px-2 py-1 rounded-md bg-gray-200 dark:bg-gray-700 capitalize">{agent.category}</span>
                  {agent.supportsFiles && (
                    <span className="text-xs px-2 py-1 rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                      Files
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
