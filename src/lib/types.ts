export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  attachments?: FileAttachment[];
  model?: string;
  timestamp: number;
}

export interface FileAttachment {
  id: string;
  name: string;
  type: string; // MIME type
  size: number;
  dataUrl: string; // base64 data URL
}

export interface Agent {
  id: string;
  name: string;
  icon: string;
  description: string;
  systemPrompt: string;
  supportsFiles: boolean;
  starters: string[];
  category: 'personal' | 'education' | 'health' | 'professional' | 'creative';
}

export interface ChatSession {
  id: string;
  title: string;
  agentId: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

export interface ModelConfig {
  id: string;
  name: string;
  provider: 'openai' | 'google' | 'groq' | 'nvidia';
  modelId: string;
  supportsVision: boolean;
  priority: number;
}
