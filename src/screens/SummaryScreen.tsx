// src/screens/SummaryScreen.tsx

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useConversationStore } from '../store/conversationStore';
import { NPCs } from '../data/npcs';
import { SummaryScreenNavigationProp, SummaryScreenRouteProp } from '../types/navigation';

export default function SummaryScreen() {
  const route = useRoute<SummaryScreenRouteProp>();
  const navigation = useNavigation<SummaryScreenNavigationProp>();
  const { conversationId } = route.params;
  
  const { conversationHistory } = useConversationStore();
  const conversation = conversationHistory.find(c => c.id === conversationId);
  
  if (!conversation) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text>Conversation not found</Text>
      </View>
    );
  }
  
  const npc = NPCs[conversation.npcId];
  const summary = conversation.summary;
  
  return (
    <View className="flex-1 bg-pink-50">
      {/* Header - Compact horizontal layout */}
      <View className="bg-white px-6 py-3 shadow-sm flex-row items-center justify-between border-b border-gray-200">
        <View className="flex-row items-center gap-4">
          <View className="w-14 h-14 bg-pink-100 rounded-full items-center justify-center">
            <Text className="text-2xl">
              {conversation.npcId === 'jack' && '👨'}
              {conversation.npcId === 'mia' && '👩'}
              {conversation.npcId === 'ethan' && '👨‍🏫'}
              {conversation.npcId === 'mark' && '👨‍💼'}
            </Text>
          </View>

          <View>
            <Text className="text-lg font-bold">{npc.name}</Text>
            <View className="flex-row items-center mt-1">
              <Text className="text-xl mr-1">
                {conversation.affinityChange >= 0 ? '❤️' : '💔'}
              </Text>
              <Text className={`text-lg font-bold ${
                conversation.affinityChange >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {conversation.affinityChange >= 0 ? '+' : ''}
                {conversation.affinityChange}
              </Text>
              <Text className="text-sm text-gray-600 ml-3">
                {conversation.messages.length} messages • Affinity: {conversation.finalAffinity}
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => navigation.navigate('Map')}
          className="bg-pink-500 px-6 py-2 rounded-full"
        >
          <Text className="text-white font-bold">Back to Map</Text>
        </TouchableOpacity>
      </View>

      {/* Two Column Layout for Content */}
      <View className="flex-1 flex-row p-4 gap-4">
        {/* Left Column */}
        <View className="flex-1 gap-3">
          {/* Overall Feedback */}
          <View className="bg-white rounded-lg p-3 shadow-sm flex-1">
            <Text className="text-base font-bold mb-2">📊 Overall Performance</Text>
            <Text className="text-sm text-gray-700">{summary?.overallFeedback}</Text>
          </View>

          {/* Strengths */}
          {summary?.strengths && summary.strengths.length > 0 && (
            <View className="bg-white rounded-lg p-3 shadow-sm border-l-4 border-green-500 flex-1">
              <Text className="text-base font-bold mb-2">👍 What You Did Well</Text>
              {summary.strengths.map((strength, index) => (
                <View key={index} className="flex-row mb-1">
                  <Text className="text-green-600 mr-2 text-sm">•</Text>
                  <Text className="flex-1 text-sm text-gray-700">{strength}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Right Column */}
        <View className="flex-1 gap-3">
          {/* Areas to Improve */}
          {summary?.areasToImprove && summary.areasToImprove.length > 0 && (
            <View className="bg-white rounded-lg p-3 shadow-sm border-l-4 border-yellow-500 flex-1">
              <Text className="text-base font-bold mb-2">📝 Areas to Improve</Text>
              {summary.areasToImprove.map((area, index) => (
                <View key={index} className="flex-row mb-1">
                  <Text className="text-yellow-600 mr-2 text-sm">•</Text>
                  <Text className="flex-1 text-sm text-gray-700">{area}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Cultural Tips */}
          {summary?.culturalTips && summary.culturalTips.length > 0 && (
            <View className="bg-white rounded-lg p-3 shadow-sm border-l-4 border-blue-500 flex-1">
              <Text className="text-base font-bold mb-2">🌏 Cultural Tips</Text>
              {summary.culturalTips.map((tip, index) => (
                <View key={index} className="flex-row mb-1">
                  <Text className="text-blue-600 mr-2 text-sm">•</Text>
                  <Text className="flex-1 text-sm text-gray-700">{tip}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    </View>
  );
}
