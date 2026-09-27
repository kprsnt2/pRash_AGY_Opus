import { ChatSession } from './types';

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
      return data ? JSON.parse(data) : { privacyMode: false, darkMode: false };
    }
  } catch (error) {
    console.error('Failed to load settings from localStorage', error);
  }
  return { privacyMode: false, darkMode: false };
}

export function saveAuthToken(token: string): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(AUTH_KEY, token);
    }
  } catch (error) {
    console.error('Failed to save auth token to localStorage', error);
  }
}

export function loadAuthToken(): string | null {
  try {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(AUTH_KEY);
    }
  } catch (error) {
    console.error('Failed to load auth token from localStorage', error);
  }
  return null;
}

export function clearAuthToken(): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(AUTH_KEY);
    }
  } catch (error) {
    console.error('Failed to clear auth token from localStorage', error);
  }
}
