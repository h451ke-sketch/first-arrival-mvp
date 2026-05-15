// src/screens/DialogueScreen.tsx

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useConversationStore } from '../store/conversationStore';
import { useGameStore } from '../store/gameStore';
import { useSettingsStore, FREE_SESSION_LIMIT } from '../store/settingsStore';
import { NPCs } from '../data/npcs';
import { Locations } from '../data/locations';
import { Tasks } from '../data/tasks';
import { transcribeAudio, generateSpeech } from '../services/deepgram';
import { generateNPCResponse, generateConversationSummary } from '../services/deepseek';
import { playTTSVoice, fadeBGMForScene, restoreBGMVolume } from '../services/audioService';
import VoiceRecorder from '../components/VoiceRecorder';
import ChatBubble from '../components/ChatBubble';
import { DialogueScreenNavigationProp, DialogueScreenRouteProp } from '../types/navigation';

export default function DialogueScreen() {
  const route = useRoute<DialogueScreenRouteProp>();
  const navigation = useNavigation<DialogueScreenNavigationProp>();
  const { locationId, npcId } = route.params;

  const scrollViewRef = useRef<ScrollView>(null);
  const sessionCounted = useRef(false);
  const totalAffinityGained = useRef(0); // tracks positive affinity applied this conversation
  const MAX_AFFINITY_PER_CONVERSATION = 10;
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    currentConversation,
    startConversation,
    addMessage,
    updateAffinity,
    endConversation,
  } = useConversationStore();

  const { getNPCAffinity, updateNPCAffinity, activeTasks, completeTask } = useGameStore();
  const { userDeepseekKey, sessionCount, incrementSessionCount } = useSettingsStore();

  const npc = NPCs[npcId];
  const location = Locations[locationId];
  const currentAffinity = getNPCAffinity(npcId);

  const hasOwnKey = userDeepseekKey.trim().length > 0;
  const canUseSession = hasOwnKey || sessionCount < FREE_SESSION_LIMIT;

  // Apply affinity change capped at MAX_AFFINITY_PER_CONVERSATION total positive gain
  const applyAffinityChange = (change: number) => {
    let effective = change;
    if (change > 0) {
      const remaining = MAX_AFFINITY_PER_CONVERSATION - totalAffinityGained.current;
      effective = Math.min(change, remaining);
      totalAffinityGained.current += effective;
    }
    if (effective !== 0) {
      updateAffinity(effective);
      updateNPCAffinity(npcId, effective);
    }
  };

  // Initialize conversation with greeting, and fade BGM when entering scene
  useEffect(() => {
    fadeBGMForScene(0.15);

    const initConversation = async () => {
      startConversation(npcId, locationId);

      try {
        const greeting = await generateNPCResponse({
          npcId,
          context: 'greeting',
          conversationHistory: [],
          location: location.displayName.en,
        });

        addMessage({ role: 'npc', content: greeting.message });
        generateAndPlayTTS(greeting.message);
      } catch (error) {
        console.error('Failed to get greeting:', error);
        const fallbackGreeting = "G'day! How can I help you today?";
        addMessage({ role: 'npc', content: fallbackGreeting });
        generateAndPlayTTS(fallbackGreeting);
      }
    };

    initConversation();

    return () => {
      restoreBGMVolume();
    };
  }, []);

  // Handle voice input
  const handleVoiceInput = async (audioUri: string) => {
    // Session limit check
    if (!canUseSession) {
      setError('session_limit');
      return;
    }

    console.log('=== DialogueScreen: handleVoiceInput Started ===');
    console.log(`Received audio URI: ${audioUri}`);

    setError(null);
    setIsProcessing(true);

    try {
      // 1. Transcribe audio
      const transcript = await transcribeAudio(audioUri);
      console.log(`[Step 1] Transcription: "${transcript.text}" (confidence: ${transcript.confidence})`);

      if (!transcript.text || transcript.text.trim().length === 0) {
        console.warn('[DialogueScreen] Empty transcription received!');
        setError('No speech detected. Please try again.');
        return;
      }

      // Count this session on first real voice input
      if (!sessionCounted.current && !hasOwnKey) {
        sessionCounted.current = true;
        await incrementSessionCount();
      }

      // 2. Add user message
      addMessage({
        role: 'user',
        content: transcript.text,
        audioTranscript: transcript.text,
      });

      // 3. Generate NPC response
      const response = await generateNPCResponse({
        npcId,
        userInput: transcript.text,
        conversationHistory: currentConversation?.messages || [],
        location: location.displayName.en,
      });

      // 4. Update affinity (capped at +10 per conversation)
      applyAffinityChange(response.affinityChange);

      // 5. Add NPC response
      addMessage({
        role: 'npc',
        content: response.message,
        affinityChange: response.affinityChange,
        feedback: response.feedback,
      });

      // 6. Generate and play TTS voice (non-blocking)
      generateAndPlayTTS(response.message);

      console.log('=== DialogueScreen: handleVoiceInput Completed ===');
    } catch (err: any) {
      console.error('=== DialogueScreen: handleVoiceInput FAILED ===', err.message || err);
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const generateAndPlayTTS = async (text: string) => {
    try {
      const audioUri = await generateSpeech(text, npc.voiceModel);
      await playTTSVoice(audioUri);
    } catch (err: any) {
      console.error('TTS error:', err.message || err);
      // TTS failure is non-critical, silently ignored
    }
  };

  const handleEndConversation = async () => {
    if (!currentConversation) return;

    // No speech = no affinity change, no task completion
    const hasUserMessages = currentConversation.messages.some(m => m.role === 'user');

    setIsProcessing(true);
    setError(null);

    try {
      const relevantTasks = activeTasks
        .map(taskId => Tasks[taskId])
        .filter(task => task && task.relatedNPCId === npcId);

      const summaryResult = await generateConversationSummary(
        npcId,
        currentConversation.messages,
        relevantTasks
      );

      // Apply summary affinity only if user actually spoke this session
      if (hasUserMessages) {
        applyAffinityChange(summaryResult.affinityChange);
      }

      endConversation({
        overallFeedback: summaryResult.overallFeedback,
        languageTips: summaryResult.languageTips,
        culturalTips: summaryResult.culturalTips,
        strengths: summaryResult.strengths,
        areasToImprove: summaryResult.areasToImprove,
      });

      summaryResult.completedTaskIds.forEach(taskId => {
        console.log(`Task completed: ${taskId}`);
        completeTask(taskId);
      });

      navigation.navigate('Summary', { conversationId: currentConversation.id });
    } catch (err: any) {
      console.error('Error generating summary:', err);
      setError('Failed to generate summary. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!currentConversation) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#FF546D" />
      </View>
    );
  }

  const sessionLimitReached = !canUseSession || error === 'session_limit';

  return (
    <View className="flex-1 flex-row bg-white">
      {/* Left Side - NPC Avatar / Video (30%) */}
      <View
        className="w-[30%] bg-gray-100"
        style={{ overflow: 'hidden' }}
      >
        {npc.video ? (
          <Video
            source={npc.video}
            style={{ width: '100%', height: '100%' }}
            resizeMode={ResizeMode.COVER}
            isLooping
            isMuted
            shouldPlay
          />
        ) : (
          <Image
            source={npc.avatar}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
        )}
      </View>

      {/* Right Side - Chat Area (70%) */}
      <View className="flex-1 bg-[#FFE3E8]">
        {/* Header */}
        <View className="bg-white px-4 py-3 shadow-sm flex-row items-center justify-between border-b border-gray-200">
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text className="text-blue-500 text-base">← Back</Text>
          </TouchableOpacity>

          <View className="flex-row items-center gap-3">
            <Text className="text-base font-bold">{npc.name}</Text>
            <View className="bg-pink-100 px-2 py-1 rounded-full">
              <Text className="text-pink-600 font-semibold text-sm">❤️ {currentAffinity}</Text>
            </View>
            <TouchableOpacity
              onPress={handleEndConversation}
              className="bg-gray-200 px-3 py-1 rounded-full"
            >
              <Text className="text-gray-700 font-semibold text-xs">End</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          className="flex-1 p-3"
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd()}
        >
          {currentConversation.messages.map((message, index) => (
            <ChatBubble
              key={index}
              message={message}
              isUser={message.role === 'user'}
            />
          ))}

          {isProcessing && (
            <View className="items-center my-3">
              <ActivityIndicator size="small" color="#FF546D" />
              <Text className="text-gray-500 mt-2 text-sm">Processing...</Text>
            </View>
          )}

          {error && error !== 'session_limit' && (
            <View className="bg-red-100 p-2 rounded-lg my-2">
              <Text className="text-red-600 text-sm">{error}</Text>
            </View>
          )}
        </ScrollView>

        {/* Session Limit Banner */}
        {sessionLimitReached && (
          <View
            className="px-4 py-3 border-t border-amber-200"
            style={{ backgroundColor: '#FFFBEB' }}
          >
            <Text className="text-amber-800 text-xs text-center">
              已用完 {FREE_SESSION_LIMIT} 次免费会话，请在设置中填写自己的 DeepSeek API Key 继续使用
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Settings')}
              className="mt-1"
            >
              <Text className="text-blue-500 text-xs text-center">前往设置 →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Voice Recorder */}
        <VoiceRecorder
          onRecordingComplete={handleVoiceInput}
          disabled={isProcessing || sessionLimitReached}
        />
      </View>
    </View>
  );
}
