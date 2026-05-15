// src/screens/ConversationHistoryScreen.tsx

import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useConversationStore } from '../store/conversationStore';
import { useGameStore } from '../store/gameStore';
import { NPCs } from '../data/npcs';
import { Locations } from '../data/locations';
import ChatBubble from '../components/ChatBubble';
import { ConversationHistoryScreenNavigationProp, ConversationHistoryScreenRouteProp } from '../types/navigation';

export default function ConversationHistoryScreen() {
  const route = useRoute<ConversationHistoryScreenRouteProp>();
  const navigation = useNavigation<ConversationHistoryScreenNavigationProp>();
  const { npcId } = route.params;

  const { conversationHistory, loadHistory } = useConversationStore();
  const { getNPCAffinity } = useGameStore();

  const npc = NPCs[npcId];
  const currentAffinity = getNPCAffinity(npcId);

  useEffect(() => {
    loadHistory();
  }, []);

  // Get all conversations with this NPC
  const npcConversations = conversationHistory.filter(conv => conv.npcId === npcId);

  // Get all messages from all conversations with this NPC, sorted by time
  const allMessages = npcConversations
    .flatMap(conv => conv.messages)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const handleStartNewConversation = () => {
    // Find the location for this NPC
    const location = Object.values(Locations).find(loc => loc.npcId === npcId);
    if (location) {
      navigation.navigate('Dialogue', {
        locationId: location.id,
        npcId: npcId
      });
    }
  };

  return (
    <View className="flex-1 bg-[#FFE3E8]">
      {/* Header */}
      <View className="bg-white px-4 py-3 shadow-sm flex-row items-center justify-between border-b border-gray-200">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text className="text-blue-500 text-base">← Back</Text>
        </TouchableOpacity>

        <View className="flex-row items-center gap-2">
          <Text className="text-base font-bold">{npc.name}</Text>
          <View className="flex-row items-center">
            <Text className="text-lg">❤️</Text>
            <Text className="text-pink-600 font-semibold text-sm ml-1">{currentAffinity}</Text>
          </View>
        </View>
      </View>

      {/* Messages History */}
      <ScrollView className="flex-1 p-3">
        {allMessages.length === 0 ? (
          <View className="flex-1 items-center justify-center py-20">
            <Text className="text-gray-500 text-lg mb-2">No conversation history</Text>
            <Text className="text-gray-400 text-sm">Start a conversation with {npc.name}!</Text>
          </View>
        ) : (
          allMessages.map((message, index) => (
            <ChatBubble
              key={`${message.id}-${index}`}
              message={message}
              isUser={message.role === 'user'}
            />
          ))
        )}
      </ScrollView>

      {/* Start New Conversation Button */}
      <View className="px-4 pb-3 bg-white border-t border-gray-200">
        <TouchableOpacity
          onPress={handleStartNewConversation}
          className="bg-gray-200 py-3 rounded-lg"
        >
          <Text className="text-center text-gray-700 font-semibold text-sm">
            Start New Conversation
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
