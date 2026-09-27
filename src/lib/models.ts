import { ModelConfig } from './types';

export function getModelChain(privacyMode: boolean): ModelConfig[] {
  const googleModel: ModelConfig = {
    id: 'google-primary',
    name: 'Google Gemini',
    provider: 'google',
    modelId: process.env.GOOGLE_MODEL || 'gemini-2.0-flash',
    supportsVision: true,
    priority: 2,
  };

  if (privacyMode) {
    return [{ ...googleModel, priority: 1 }];
  }

  return [
    {
      id: 'openai-primary',
      name: 'OpenAI GPT',
      provider: 'openai',
      modelId: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      supportsVision: true,
      priority: 1,
    },
    googleModel,
    {
      id: 'groq-fallback',
      name: 'Groq Llama',
      provider: 'groq',
      modelId: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      supportsVision: false,
      priority: 3,
    },
    {
      id: 'nvidia-fallback',
      name: 'NVIDIA Llama',
      provider: 'nvidia',
      modelId: process.env.NVIDIA_MODEL || 'meta/llama-3.1-70b-instruct',
      supportsVision: false,
      priority: 4,
    }
  ];
}
