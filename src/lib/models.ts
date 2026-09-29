import { ModelConfig, ModelProvider } from './types';

/** Canonical default models — latest as of 2026 */
export const CANONICAL_MODELS: Record<ModelProvider, string> = {
  openai: 'gpt-5.4-mini',
  google: 'gemini-flash-latest',
  groq: 'meta-llama/llama-4-scout-17b-16e-instruct',
  nvidia: 'meta/llama-3.2-90b-vision-instruct',
};

export const PROVIDER_LABELS: Record<ModelProvider, { name: string; badge: string; color: string }> = {
  openai: {
    name: 'OpenAI',
    badge: 'OpenAI',
    color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  },
  google: {
    name: 'Google Gemini',
    badge: 'Gemini',
    color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  },
  nvidia: {
    name: 'NVIDIA NIM',
    badge: 'NVIDIA',
    color: 'bg-lime-500/20 text-lime-400 border-lime-500/30',
  },
  groq: {
    name: 'Groq LPU',
    badge: 'Groq',
    color: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  },
};

/** Get the configured model for a provider, respecting env variable overrides */
export function getModelForProvider(provider: ModelProvider): string {
  const envMap: Record<ModelProvider, string | undefined> = {
    openai: process.env.OPENAI_MODEL,
    google: process.env.GOOGLE_MODEL,
    groq: process.env.GROQ_MODEL,
    nvidia: process.env.NVIDIA_MODEL,
  };
  const envVal = envMap[provider]?.trim();
  return envVal || CANONICAL_MODELS[provider];
}

/** Build the model fallback chain based on mode */
export function getModelChain(privacyMode: boolean): ModelConfig[] {
  const googleModel: ModelConfig = {
    id: 'google-primary',
    name: `Gemini · ${getModelForProvider('google')}`,
    provider: 'google',
    modelId: getModelForProvider('google'),
    supportsVision: true,
    priority: 2,
  };

  if (privacyMode) {
    return [{ ...googleModel, priority: 1 }];
  }

  return [
    {
      id: 'openai-primary',
      name: `OpenAI · ${getModelForProvider('openai')}`,
      provider: 'openai',
      modelId: getModelForProvider('openai'),
      supportsVision: true,
      priority: 1,
    },
    googleModel,
    {
      id: 'groq-fallback',
      name: `Groq · ${getModelForProvider('groq')}`,
      provider: 'groq',
      modelId: getModelForProvider('groq'),
      supportsVision: false,
      priority: 3,
    },
    {
      id: 'nvidia-fallback',
      name: `NVIDIA · ${getModelForProvider('nvidia')}`,
      provider: 'nvidia',
      modelId: getModelForProvider('nvidia'),
      supportsVision: false,
      priority: 4,
    },
  ];
}
