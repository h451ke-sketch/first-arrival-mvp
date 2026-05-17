// src/screens/SettingsScreen.tsx

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  BackHandler,
  Alert,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Slider from '@react-native-community/slider';
import { useAudioStore } from '../store/audioStore';
import { useGameStore } from '../store/gameStore';
import { useConversationStore } from '../store/conversationStore';
import { useSettingsStore, FREE_SESSION_LIMIT } from '../store/settingsStore';
import { setBGMVolume, setVoiceVolume } from '../services/audioService';
import { SettingsScreenNavigationProp } from '../types/navigation';

export default function SettingsScreen() {
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const {
    bgmVolume,
    voiceVolume,
    setBGMVolume: updateBGMVolume,
    setVoiceVolume: updateVoiceVolume,
    loadSettings,
  } = useAudioStore();

  const { resetProgress } = useGameStore();
  const { clearAllConversations } = useConversationStore();
  const { userDeepseekKey, sessionCount, setDeepseekKey } = useSettingsStore();

  const [isResetting, setIsResetting] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isSavingKey, setIsSavingKey] = useState(false);

  useEffect(() => {
    loadSettings();
    setKeyInput(userDeepseekKey);
  }, []);

  const handleBGMVolumeChange = (value: number) => {
    updateBGMVolume(value);
    setBGMVolume(value);
  };

  const handleVoiceVolumeChange = (value: number) => {
    updateVoiceVolume(value);
    setVoiceVolume(value);
  };

  const handleExit = () => {
    navigation.goBack();
  };

  const handleBackgroundPress = () => {
    navigation.goBack();
  };

  const handleCardPress = (e: any) => {
    e.stopPropagation();
  };

  const handleSaveKey = async () => {
    setIsSavingKey(true);
    try {
      await setDeepseekKey(keyInput);
      if (Platform.OS === 'web') {
        alert(keyInput.trim() ? 'API Key saved. Session limit removed.' : 'API Key cleared.');
      } else {
        Alert.alert(
          'Saved',
          keyInput.trim()
            ? 'API Key saved. Session limit removed.'
            : 'API Key cleared.'
        );
      }
    } finally {
      setIsSavingKey(false);
    }
  };

  const handleResetProgress = () => {
    const title = 'Reset All Progress';
    const message = 'Are you sure you want to reset all progress? This will delete:\n\n• All task progress\n• All NPC relationships\n• All conversation history\n• Unlocked locations\n\nThis action cannot be undone.';

    const doReset = async () => {
      setIsResetting(true);
      try {
        await resetProgress();
        await clearAllConversations();
        if (Platform.OS === 'web') {
          alert('All progress has been reset successfully.');
        } else {
          Alert.alert('Success', 'All progress has been reset successfully.');
        }
        navigation.goBack();
      } catch (error) {
        if (Platform.OS === 'web') {
          alert('Failed to reset progress. Please try again.');
        } else {
          Alert.alert('Error', 'Failed to reset progress. Please try again.');
        }
      } finally {
        setIsResetting(false);
      }
    };

    if (Platform.OS === 'web') {
      const confirmed = window.confirm(message);
      if (confirmed) {
        doReset();
      }
    } else {
      Alert.alert(
        title,
        message,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Reset',
            style: 'destructive',
            onPress: doReset,
          },
        ]
      );
    }
  };

  const hasOwnKey = userDeepseekKey.trim().length > 0;
  const sessionsLeft = Math.max(0, FREE_SESSION_LIMIT - sessionCount);

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={handleBackgroundPress}
      className="flex-1 items-center justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ maxHeight: '86%', width: '100%', alignItems: 'center' }}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={handleCardPress}
          className="bg-white rounded-3xl p-4"
          style={{
            width: 330,
            maxWidth: '86%',
            maxHeight: '100%',
          }}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 8 }}
          >
            {/* Title */}
            <Text className="text-xl font-bold text-center mb-3">Settings</Text>

            {/* Avatar and Username */}
            <View className="items-center mb-3">
              <View className="w-14 h-14 bg-gray-300 rounded-full mb-1" />
              <Text className="text-base font-semibold">Cecile_</Text>
            </View>

            {/* BGM Volume Slider */}
            <View className="mb-2">
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-sm font-medium">BGM</Text>
                <Text className="text-xs text-gray-500">{Math.round(bgmVolume * 100)}%</Text>
              </View>
              <Slider
                value={bgmVolume}
                onValueChange={handleBGMVolumeChange}
                minimumValue={0}
                maximumValue={1}
                minimumTrackTintColor="#FF0000"
                maximumTrackTintColor="#DDDDDD"
                thumbTintColor="#FF0000"
                style={{ width: '100%', height: 34 }}
              />
            </View>

            {/* Voice Volume Slider */}
            <View className="mb-3">
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-sm font-medium">Voice</Text>
                <Text className="text-xs text-gray-500">{Math.round(voiceVolume * 100)}%</Text>
              </View>
              <Slider
                value={voiceVolume}
                onValueChange={handleVoiceVolumeChange}
                minimumValue={0}
                maximumValue={1}
                minimumTrackTintColor="#4A90E2"
                maximumTrackTintColor="#DDDDDD"
                thumbTintColor="#4A90E2"
                style={{ width: '100%', height: 34 }}
              />
            </View>

            {/* API Key Section */}
            <View className="border-t border-gray-200 pt-3 mb-3">
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-sm font-medium">DeepSeek API Key</Text>
                {hasOwnKey ? (
                  <Text className="text-xs text-green-600 font-semibold">✓ Unlimited</Text>
                ) : (
                  <Text className="text-xs text-orange-500">
                    {sessionsLeft} / {FREE_SESSION_LIMIT} sessions left
                  </Text>
                )}
              </View>

              <View className="flex-row items-center gap-2">
                <TextInput
                  value={keyInput}
                  onChangeText={setKeyInput}
                  secureTextEntry={!showKey}
                  placeholder="sk-xxxxxxxxxxxxxxxx"
                  placeholderTextColor="#BBBBBB"
                  autoCapitalize="none"
                  autoCorrect={false}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800"
                  style={{ fontFamily: 'monospace' }}
                />
                <TouchableOpacity onPress={() => setShowKey(v => !v)} className="px-2">
                  <Text className="text-gray-500 text-xs">{showKey ? 'Hide' : 'Show'}</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={handleSaveKey}
                disabled={isSavingKey}
                className="mt-2 items-center py-2 px-4 rounded-lg"
                style={{ backgroundColor: isSavingKey ? '#CCCCCC' : '#4A90E2' }}
              >
                {isSavingKey ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text className="text-white text-sm font-semibold">Save Key</Text>
                )}
              </TouchableOpacity>

              {!hasOwnKey && sessionsLeft === 0 && (
                <Text className="text-xs text-red-500 text-center mt-1">
                  Free sessions used up. Add your own key to continue.
                </Text>
              )}
            </View>

            {/* Help Button */}
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-sm">Help</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Help')}
                className="px-5 py-1.5 rounded-lg"
                style={{ backgroundColor: '#E8744F' }}
              >
                <Text className="text-white font-semibold text-sm">Go</Text>
              </TouchableOpacity>
            </View>

            {/* Reset Progress Button */}
            <View className="border-t border-gray-200 pt-3 mt-1 mb-2">
              <TouchableOpacity
                onPress={handleResetProgress}
                disabled={isResetting}
                className="items-center py-2 px-4 rounded-lg"
                style={{ backgroundColor: isResetting ? '#CCCCCC' : '#FF6B6B' }}
              >
                {isResetting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text className="text-white text-sm font-semibold">Reset All Progress</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Exit Button */}
            <TouchableOpacity onPress={handleExit} className="items-center py-2">
              <Text className="text-red-500 text-sm font-semibold">Exit</Text>
            </TouchableOpacity>
          </ScrollView>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </TouchableOpacity>
  );
}
