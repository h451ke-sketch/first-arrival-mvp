// src/store/audioStore.ts

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AudioState {
  bgmVolume: number;      // BGM 音量 (0-1)
  voiceVolume: number;    // 人物语音音量 (0-1)
  isMuted: boolean;       // 全局静音

  // Actions
  setBGMVolume: (volume: number) => void;
  setVoiceVolume: (volume: number) => void;
  toggleMute: () => void;
  loadSettings: () => Promise<void>;
  saveSettings: () => Promise<void>;
}

export const useAudioStore = create<AudioState>((set, get) => ({
  // Initial state
  bgmVolume: 0.5,
  voiceVolume: 0.7,
  isMuted: false,

  // Actions
  setBGMVolume: (volume) => {
    set({ bgmVolume: Math.max(0, Math.min(1, volume)) });
    get().saveSettings();
  },

  setVoiceVolume: (volume) => {
    set({ voiceVolume: Math.max(0, Math.min(1, volume)) });
    get().saveSettings();
  },

  toggleMute: () => {
    set((state) => ({ isMuted: !state.isMuted }));
    get().saveSettings();
  },

  loadSettings: async () => {
    try {
      const saved = await AsyncStorage.getItem('@audio_settings');
      if (saved) {
        const settings = JSON.parse(saved);
        set({
          bgmVolume: settings.bgmVolume ?? 0.5,
          voiceVolume: settings.voiceVolume ?? 0.7,
          isMuted: settings.isMuted ?? false
        });
      }
    } catch (error) {
      console.error('Failed to load audio settings:', error);
    }
  },

  saveSettings: async () => {
    try {
      const state = get();
      const toSave = {
        bgmVolume: state.bgmVolume,
        voiceVolume: state.voiceVolume,
        isMuted: state.isMuted
      };
      await AsyncStorage.setItem('@audio_settings', JSON.stringify(toSave));
    } catch (error) {
      console.error('Failed to save audio settings:', error);
    }
  }
}));
