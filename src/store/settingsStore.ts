// src/store/settingsStore.ts

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@user_settings';
export const FREE_SESSION_LIMIT = 20;

interface SettingsState {
  userDeepseekKey: string;
  sessionCount: number;

  setDeepseekKey: (key: string) => Promise<void>;
  incrementSessionCount: () => Promise<void>;
  loadSettings: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  userDeepseekKey: '',
  sessionCount: 0,

  setDeepseekKey: async (key) => {
    const trimmed = key.trim();
    set({ userDeepseekKey: trimmed });
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ userDeepseekKey: trimmed, sessionCount: get().sessionCount })
    );
  },

  incrementSessionCount: async () => {
    const newCount = get().sessionCount + 1;
    set({ sessionCount: newCount });
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ userDeepseekKey: get().userDeepseekKey, sessionCount: newCount })
    );
  },

  loadSettings: async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        set({
          userDeepseekKey: data.userDeepseekKey || '',
          sessionCount: data.sessionCount || 0,
        });
      }
    } catch (error) {
      console.error('Failed to load user settings:', error);
    }
  },
}));
