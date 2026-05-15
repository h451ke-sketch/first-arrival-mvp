// src/screens/ContactsScreen.tsx

import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useGameStore } from '../store/gameStore';
import { NPCs } from '../data/npcs';
import { ContactsScreenNavigationProp } from '../types/navigation';

export default function ContactsScreen() {
  const navigation = useNavigation<ContactsScreenNavigationProp>();
  const { npcAffinity, loadProgress } = useGameStore();

  const screenWidth = Dimensions.get('window').width;
  const drawerWidth = screenWidth * 0.35; // 35% of screen width

  useEffect(() => {
    loadProgress();
  }, []);

  // Get all NPCs with conversationCount > 0, sorted by affinity descending
  const metNPCs = Object.entries(npcAffinity)
    .filter(([_, affinity]) => affinity.conversationCount > 0)
    .map(([npcId, affinity]) => ({
      npc: NPCs[npcId],
      affinity
    }))
    .sort((a, b) => b.affinity.currentAffinity - a.affinity.currentAffinity);

  // Get heart icon based on affinity
  const getHeartIcon = (affinity: number) => {
    if (affinity >= 85) return '❤️';
    if (affinity >= 60) return '🧡';
    if (affinity >= 30) return '🤍';
    return '🩶';
  };

  const handleBackgroundPress = () => {
    navigation.goBack();
  };

  const handleDrawerPress = (e: any) => {
    e.stopPropagation();
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={handleBackgroundPress}
      className="flex-1 flex-row"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
    >
      {/* Left Drawer */}
      <TouchableOpacity
        activeOpacity={1}
        onPress={handleDrawerPress}
        className="bg-white"
        style={{ width: drawerWidth }}
      >
        {/* Title */}
        <View className="py-6 items-center border-b border-gray-200">
          <Text className="text-xl font-bold text-black">Contacts</Text>
        </View>

        {/* Contacts List */}
        <ScrollView className="flex-1">
          {metNPCs.length === 0 ? (
            <View className="items-center justify-center py-20 px-4">
              <Text className="text-4xl mb-2">👥</Text>
              <Text className="text-gray-500 text-center">No contacts yet</Text>
            </View>
          ) : (
            metNPCs.map(({ npc, affinity }) => (
              <TouchableOpacity
                key={npc.id}
                onPress={() => {
                  navigation.navigate('ConversationHistory', {
                    npcId: npc.id
                  });
                }}
                className="px-4 py-4 flex-row items-center"
              >
                {/* Avatar */}
                <Image
                  source={npc.avatar}
                  style={{ width: 50, height: 50, borderRadius: 25 }}
                  resizeMode="cover"
                />

                {/* Name and Heart */}
                <View className="ml-3 flex-1">
                  <Text className="text-base font-medium">{npc.name}</Text>
                </View>

                {/* Heart Icon and Affinity */}
                <View className="flex-row items-center gap-1">
                  <Text className="text-xl">{getHeartIcon(affinity.currentAffinity)}</Text>
                  <Text className="text-sm font-semibold text-gray-600">{affinity.currentAffinity}</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </TouchableOpacity>

      {/* Right Empty Space (closes drawer on tap) */}
      <View className="flex-1" />
    </TouchableOpacity>
  );
}
