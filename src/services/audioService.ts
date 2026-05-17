// src/services/audioService.ts

import { Platform } from 'react-native';
import { Audio } from 'expo-av';
import { useAudioStore } from '../store/audioStore';

// expo-av 的 setAudioModeAsync 在 web 端会因 allowsRecordingIOS 等参数抛 "unsupported" 警告或异常
// 这里集中做一次平台屏蔽
async function safeSetAudioMode(mode: Parameters<typeof Audio.setAudioModeAsync>[0]) {
  if (Platform.OS === 'web') return;
  try {
    await Audio.setAudioModeAsync(mode);
  } catch (e) {
    console.warn('[AudioService] setAudioModeAsync ignored:', (e as Error).message);
  }
}

// ============ 音频功能开关 ============
const AUDIO_ENABLED = true;   // 总开关
const BGM_ENABLED = true;     // BGM 功能开关
const VOICE_ENABLED = true;   // 语音功能开关

// ============ BGM 音频资源 ============
// 使用步骤：
//   1. 将 BGM 文件（mp3/wav）放入 assets/audio/ 目录
//   2. 取消对应行的注释，改为 require(...)
const BGM_ASSETS: Record<string, any> = {
  main: require('../../assets/audio/BGM.mp3'),
};

// ============ BGM 管理 ============

let bgmSound: Audio.Sound | null = null;
let currentBGMTrack: string | null = null;

// BGM 场景音量倍率（1.0 = 正常，0.2 = 进入对话场景时降音）
let bgmSceneMultiplier: number = 1.0;

/**
 * 播放背景音乐
 * @param trackName BGM 轨道名称，需在 BGM_ASSETS 中有对应资源
 */
export async function playBGM(trackName: string): Promise<void> {
  if (!AUDIO_ENABLED || !BGM_ENABLED) {
    console.log(`[AudioService] playBGM: ${trackName} (disabled)`);
    return;
  }

  const trackAsset = BGM_ASSETS[trackName];
  if (!trackAsset) {
    console.log(`[AudioService] BGM "${trackName}" - 音频文件未加载，请将文件添加到 assets/audio/ 目录并取消注释`);
    return;
  }

  const { bgmVolume, isMuted } = useAudioStore.getState();

  try {
    // 如果已经在播放同一首曲子，只需恢复播放
    if (bgmSound && currentBGMTrack === trackName) {
      try {
        await bgmSound.playAsync();
      } catch (e) {
        // 如果被浏览器阻止，注册一次性交互事件恢复（使用捕获阶段以防 React Native Web 阻止冒泡）
        if (Platform.OS === 'web' && typeof document !== 'undefined') {
          const resumeOnInteraction = async () => {
            try {
              if (bgmSound) await bgmSound.playAsync();
            } catch (err) {}
            document.removeEventListener('click', resumeOnInteraction, true);
            document.removeEventListener('touchstart', resumeOnInteraction, true);
            document.removeEventListener('keydown', resumeOnInteraction, true);
          };
          document.addEventListener('click', resumeOnInteraction, { capture: true, once: true });
          document.addEventListener('touchstart', resumeOnInteraction, { capture: true, once: true });
          document.addEventListener('keydown', resumeOnInteraction, { capture: true, once: true });
        }
      }
      return;
    }

    // 停止并卸载之前的音乐
    if (bgmSound) {
      await bgmSound.unloadAsync();
    }

    // 加载音乐资源 (应使用 shouldPlay: false, 避免在浏览器上由于 Autoplay 阻止导致 createAsync 抛出致命异常)
    const { sound } = await Audio.Sound.createAsync(
      trackAsset,
      {
        shouldPlay: false,
        isLooping: true,
        volume: isMuted ? 0 : bgmVolume * bgmSceneMultiplier
      }
    );

    bgmSound = sound;
    currentBGMTrack = trackName;

    // 尝试播放音频并处理 Autoplay 被浏览器拦截的情况
    const tryPlay = async () => {
      try {
        await sound.playAsync();
        console.log(`[AudioService] Playing BGM: ${trackName}, volume: ${bgmVolume * bgmSceneMultiplier}`);
      } catch (playError) {
        console.warn('[AudioService] BGM autoplay blocked, waiting for user interaction to play BGM.');
        
        // Web 端：注册一次性交互事件，点击/触摸/按键后立即恢复播放（使用捕获阶段以防 React Native Web 阻止冒泡）
        if (Platform.OS === 'web' && typeof document !== 'undefined') {
          const resumeOnInteraction = async () => {
            try {
              if (bgmSound) {
                await bgmSound.playAsync();
                console.log('[AudioService] BGM successfully resumed after user interaction');
              }
            } catch (e) {
              console.error('[AudioService] BGM failed to play on interaction:', e);
            }
            document.removeEventListener('click', resumeOnInteraction, true);
            document.removeEventListener('touchstart', resumeOnInteraction, true);
            document.removeEventListener('keydown', resumeOnInteraction, true);
          };
          document.addEventListener('click', resumeOnInteraction, { capture: true, once: true });
          document.addEventListener('touchstart', resumeOnInteraction, { capture: true, once: true });
          document.addEventListener('keydown', resumeOnInteraction, { capture: true, once: true });
        }
      }
    };

    await tryPlay();
  } catch (error) {
    console.error('Failed to play BGM:', error);
  }
}

/**
 * 停止背景音乐
 */
export async function stopBGM(): Promise<void> {
  if (!AUDIO_ENABLED || !BGM_ENABLED) {
    console.log('[AudioService] stopBGM (disabled)');
    return;
  }

  try {
    if (bgmSound) {
      await bgmSound.stopAsync();
      await bgmSound.unloadAsync();
      bgmSound = null;
      currentBGMTrack = null;
      console.log('[AudioService] BGM stopped');
    }
  } catch (error) {
    console.error('Failed to stop BGM:', error);
  }
}

/**
 * 恢复背景音乐（暂停后继续播放）
 */
export async function resumeBGM(): Promise<void> {
  if (!AUDIO_ENABLED || !BGM_ENABLED) return;

  try {
    if (bgmSound) {
      await bgmSound.playAsync();
    }
  } catch (error) {
    console.error('Failed to resume BGM:', error);
  }
}

/**
 * 暂停背景音乐
 */
export async function pauseBGM(): Promise<void> {
  if (!AUDIO_ENABLED || !BGM_ENABLED) {
    console.log('[AudioService] pauseBGM (disabled)');
    return;
  }

  try {
    if (bgmSound) {
      await bgmSound.pauseAsync();
      console.log('[AudioService] BGM paused');
    }
  } catch (error) {
    console.error('Failed to pause BGM:', error);
  }
}

/**
 * 设置 BGM 音量（由设置页滑块调用，会叠加当前场景倍率）
 */
export async function setBGMVolume(volume: number): Promise<void> {
  if (!AUDIO_ENABLED || !BGM_ENABLED) return;

  const { isMuted } = useAudioStore.getState();

  try {
    if (bgmSound) {
      await bgmSound.setVolumeAsync(isMuted ? 0 : volume * bgmSceneMultiplier);
      console.log(`[AudioService] BGM volume set to: ${volume * bgmSceneMultiplier} (base: ${volume}, scene multiplier: ${bgmSceneMultiplier})`);
    }
  } catch (error) {
    console.error('Failed to set BGM volume:', error);
  }
}

/**
 * 进入场景时降低 BGM 音量
 * @param multiplier 音量倍率（如 0.2 = 降至 BGM 设定音量的 20%）
 */
export async function fadeBGMForScene(multiplier: number): Promise<void> {
  if (!AUDIO_ENABLED || !BGM_ENABLED) return;

  bgmSceneMultiplier = multiplier;
  const { bgmVolume, isMuted } = useAudioStore.getState();

  try {
    if (bgmSound) {
      await bgmSound.setVolumeAsync(isMuted ? 0 : bgmVolume * multiplier);
      console.log(`[AudioService] BGM faded to ${Math.round(multiplier * 100)}% of setting (actual volume: ${bgmVolume * multiplier})`);
    }
  } catch (error) {
    console.error('Failed to fade BGM:', error);
  }
}

/**
 * 离开场景时恢复 BGM 音量至设定值
 */
export async function restoreBGMVolume(): Promise<void> {
  if (!AUDIO_ENABLED || !BGM_ENABLED) return;

  bgmSceneMultiplier = 1.0;
  const { bgmVolume, isMuted } = useAudioStore.getState();

  try {
    if (bgmSound) {
      await bgmSound.setVolumeAsync(isMuted ? 0 : bgmVolume);
      console.log(`[AudioService] BGM volume restored to: ${bgmVolume}`);
    }
  } catch (error) {
    console.error('Failed to restore BGM volume:', error);
  }
}

// ============ 语音管理 ============

let voiceSound: Audio.Sound | null = null;

/**
 * 播放人物语音
 * @param voiceFile 语音文件名（不含扩展名）
 */
export async function playVoice(voiceFile: string): Promise<void> {
  if (!AUDIO_ENABLED || !VOICE_ENABLED) {
    console.log(`[AudioService] playVoice: ${voiceFile} (disabled)`);
    return;
  }

  const { voiceVolume, isMuted } = useAudioStore.getState();

  try {
    // 停止之前的语音
    if (voiceSound) {
      await voiceSound.unloadAsync();
    }

    // 加载并播放语音
    const { sound } = await Audio.Sound.createAsync(
      // TODO: 替换为实际的音频文件路径
      { uri: `placeholder_voice_${voiceFile}` }, // 占位符
      {
        shouldPlay: true,
        volume: isMuted ? 0 : voiceVolume
      }
    );

    voiceSound = sound;

    // 播放完成后自动卸载
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        sound.unloadAsync();
        voiceSound = null;
      }
    });

    console.log(`[AudioService] Playing voice: ${voiceFile}, volume: ${voiceVolume}`);
  } catch (error) {
    console.error('Failed to play voice:', error);
  }
}

/**
 * 停止语音播放
 */
export async function stopVoice(): Promise<void> {
  if (!AUDIO_ENABLED || !VOICE_ENABLED) {
    console.log('[AudioService] stopVoice (disabled)');
    return;
  }

  try {
    if (voiceSound) {
      await voiceSound.stopAsync();
      await voiceSound.unloadAsync();
      voiceSound = null;
      console.log('[AudioService] Voice stopped');
    }
  } catch (error) {
    console.error('Failed to stop voice:', error);
  }
}

/**
 * 设置语音音量
 */
export async function setVoiceVolume(volume: number): Promise<void> {
  if (!AUDIO_ENABLED || !VOICE_ENABLED) return;

  const { isMuted } = useAudioStore.getState();

  try {
    if (voiceSound) {
      await voiceSound.setVolumeAsync(isMuted ? 0 : volume);
      console.log(`[AudioService] Voice volume set to: ${volume}`);
    }
  } catch (error) {
    console.error('Failed to set voice volume:', error);
  }
}

/**
 * 播放 TTS 生成的语音（从本地 URI）
 * @param audioUri 音频文件的本地 URI
 */
export async function playTTSVoice(audioUri: string): Promise<void> {
  if (!AUDIO_ENABLED || !VOICE_ENABLED) {
    console.log(`[AudioService] playTTSVoice: ${audioUri} (disabled)`);
    return;
  }

  const { voiceVolume, isMuted } = useAudioStore.getState();

  try {
    // 停止之前的语音
    if (voiceSound) {
      await voiceSound.unloadAsync();
    }

    // 重新设置音频模式（修复录音后无法播放的问题）
    // 必须设置 allowsRecordingIOS: false，否则 iOS 保持录音模式会静音播放
    await safeSetAudioMode({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });

    // 加载并播放 TTS 语音
    const { sound } = await Audio.Sound.createAsync(
      { uri: audioUri },
      {
        shouldPlay: true,
        volume: isMuted ? 0 : voiceVolume
      }
    );

    voiceSound = sound;

    // 播放完成后自动卸载
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        sound.unloadAsync();
        voiceSound = null;
      }
    });

    console.log(`[AudioService] Playing TTS voice, volume: ${voiceVolume}`);
  } catch (error) {
    console.error('Failed to play TTS voice:', error);
  }
}

// ============ 初始化 ============

/**
 * 初始化音频系统
 */
export async function initAudioSystem(): Promise<void> {
  if (!AUDIO_ENABLED) {
    console.log('[AudioService] Audio system disabled');
    return;
  }

  try {
    await safeSetAudioMode({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });
    console.log('[AudioService] Audio system initialized');
  } catch (error) {
    console.error('Failed to initialize audio system:', error);
  }
}
