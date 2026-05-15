// src/components/VoiceRecorder.tsx
// NOTE: Using expo-av for recording despite deprecation warning
// expo-audio in SDK 54 doesn't support iOS audio session configuration yet
// Will migrate when expo-audio matures in future SDK versions

import React, { useState } from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import { Audio } from 'expo-av';
import { stopVoice, pauseBGM, resumeBGM } from '../services/audioService';

interface VoiceRecorderProps {
  onRecordingComplete: (audioUri: string) => void;
  disabled?: boolean;
}

export default function VoiceRecorder({ onRecordingComplete, disabled }: VoiceRecorderProps) {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const startRecording = async () => {
    try {
      console.log('[VoiceRecorder] Starting recording...');

      // 停止 TTS 并暂停 BGM（iOS 录音需要独占音频会话）
      await stopVoice();
      await pauseBGM();

      // Request permissions
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        alert('Microphone permission is required');
        return;
      }

      // Configure audio mode for recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      // Start recording
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
      setIsRecording(true);
      console.log('[VoiceRecorder] Recording started successfully');

    } catch (error) {
      console.error('[VoiceRecorder] Failed to start recording:', error);
      alert('Failed to start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      console.log('[VoiceRecorder] Stopping recording...');
      setIsRecording(false);

      await recording.stopAndUnloadAsync();

      // 重置音频模式：关闭录音模式，恢复播放模式
      // 这是修复 TTS 在录音后无法播放的关键
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      // 恢复 BGM
      await resumeBGM();

      const uri = recording.getURI();

      console.log(`[VoiceRecorder] Recording stopped, URI: ${uri}`);

      if (uri) {
        onRecordingComplete(uri);
      } else {
        console.warn('[VoiceRecorder] No URI received from recording');
      }

      setRecording(null);

    } catch (error) {
      console.error('[VoiceRecorder] Failed to stop recording:', error);
      alert('Failed to process recording. Please try again.');
    }
  };
  
  return (
    <View className="items-center justify-center py-2 px-3 bg-white border-t border-gray-200 flex-row">
      <TouchableOpacity
        onPressIn={startRecording}
        onPressOut={stopRecording}
        disabled={disabled}
        className={`w-14 h-14 rounded-full items-center justify-center ${
          isRecording ? 'bg-red-500' : 'bg-pink-400'
        } ${disabled ? 'opacity-50' : 'opacity-100'}`}
      >
        <Text className="text-white text-2xl">
          {isRecording ? '⬜' : '🎤'}
        </Text>
      </TouchableOpacity>

      <Text className="ml-3 text-gray-600 text-xs">
        {isRecording ? 'Release to send' : 'Hold to speak'}
      </Text>

      {isRecording && (
        <View className="ml-2 flex-row space-x-1">
          <View className="w-1 h-2 bg-red-500 animate-pulse" />
          <View className="w-1 h-3 bg-red-500 animate-pulse delay-75" />
          <View className="w-1 h-2 bg-red-500 animate-pulse delay-150" />
        </View>
      )}
    </View>
  );
}
