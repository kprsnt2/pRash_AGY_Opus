import { ChatSession, ExportBundle } from './types';

const CHATS_KEY = 'prash-hub-chats';
const SETTINGS_KEY = 'prash-hub-settings';
const AUTH_KEY = 'prash-hub-auth';

export function saveChats(chats: ChatSession[]): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(CHATS_KEY, JSON.stringify(chats));
    }
  } catch (error) {
    console.error('Failed to save chats to localStorage', error);
  }
}

export function loadChats(): ChatSession[] {
  try {
    if (typeof window !== 'undefined') {
      const data = localStorage.getItem(CHATS_KEY);
      return data ? JSON.parse(data) : [];
    }
  } catch (error) {
    console.error('Failed to load chats from localStorage', error);
  }
  return [];
}

export function saveSettings(settings: { privacyMode: boolean; darkMode: boolean }): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    }
  } catch (error) {
    console.error('Failed to save settings to localStorage', error);
  }
}

export function loadSettings(): { privacyMode: boolean; darkMode: boolean } {
  try {
    if (typeof window !== 'undefined') {
      const data = localStorage.getItem(SETTINGS_KEY);
      return data ? JSON.parse(data) : { privacyMode: false, darkMode: true };
    }
  } catch (error) {
    console.error('Failed to load settings from localStorage', error);
  }
  return { privacyMode: false, darkMode: true };
}

export function saveAuthToken(token: string): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(AUTH_KEY, token);
    }
  } catch (error) {
    console.error('Failed to save auth token', error);
  }
}

export function loadAuthToken(): string | null {
  try {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(AUTH_KEY);
    }
  } catch (error) {
    console.error('Failed to load auth token', error);
  }
  return null;
}

export function clearAuthToken(): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(AUTH_KEY);
    }
  } catch (error) {
    console.error('Failed to clear auth token', error);
  }
}

/* ===================== Export / Import ===================== */

/** Export all chats as a downloadable JSON file */
export function exportChats(chats: ChatSession[]): void {
  const bundle: ExportBundle = {
    app: 'prash-hub',
    version: 1,
    exportedAt: Date.now(),
    chats,
  };

  const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `prash-hub-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Import chats from a JSON backup file. Returns merged chat list + count of imported chats. */
export async function importChats(
  file: File,
  existingChats: ChatSession[]
): Promise<{ chats: ChatSession[]; imported: number }> {
  const text = await file.text();
  const bundle: ExportBundle = JSON.parse(text);

  if (!bundle || bundle.app !== 'prash-hub') {
    throw new Error('Not a valid pRash Hub backup file');
  }

  const existingIds = new Set(existingChats.map((c) => c.id));
  const newChats: ChatSession[] = [];
  let imported = 0;

  for (const chat of bundle.chats) {
    if (existingIds.has(chat.id)) {
      // Collision — generate new ID so existing chat isn't overwritten
      const newId = crypto.randomUUID();
      newChats.push({ ...chat, id: newId, title: chat.title + ' (imported)' });
    } else {
      newChats.push(chat);
    }
    imported++;
  }

  const mergedChats = [...newChats, ...existingChats].sort((a, b) => b.updatedAt - a.updatedAt);
  return { chats: mergedChats, imported };
}
