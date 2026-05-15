// App.tsx

import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './src/navigation/AppNavigator';
import { initAudioSystem } from './src/services/audioService';
import { useAudioStore } from './src/store/audioStore';
import { useSettingsStore } from './src/store/settingsStore';
import { injectGlobalWebStyles } from './src/utils/webStyles';
import { StageProvider } from './src/utils/stage';

// Web 端：在 React 挂载前先把横屏 letterbox CSS 写进 <head>
injectGlobalWebStyles();

export default function App() {
  const { loadSettings: loadAudioSettings } = useAudioStore();
  const { loadSettings: loadUserSettings } = useSettingsStore();

  useEffect(() => {
    const init = async () => {
      await loadAudioSettings();
      await loadUserSettings();
      await initAudioSystem();
    };
    init();
  }, []);

  return (
    <StageProvider>
      <AppNavigator />
      <StatusBar style="auto" />
    </StageProvider>
  );
}
