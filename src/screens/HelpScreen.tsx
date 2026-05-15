// src/screens/HelpScreen.tsx

import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { HelpScreenNavigationProp } from '../types/navigation';

export default function HelpScreen() {
  const navigation = useNavigation<HelpScreenNavigationProp>();

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="bg-white px-6 py-4 shadow-sm flex-row items-center border-b border-gray-200">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
          <Text className="text-blue-500 text-lg">← Back</Text>
        </TouchableOpacity>
        <Text className="text-xl font-bold">Help</Text>
      </View>

      {/* Content */}
      <ScrollView className="flex-1 p-6">
        <View className="mb-6">
          <Text className="text-2xl font-bold mb-4">📖 How to Use First Arrival</Text>
          <Text className="text-gray-600 leading-6 mb-4">
            Welcome to First Arrival! This app helps you practice English conversation for studying in Australia.
          </Text>
        </View>

        <View className="mb-6">
          <Text className="text-lg font-bold mb-2">🗺️ Map Screen</Text>
          <Text className="text-gray-600 leading-6">
            • Tap on locations to visit them{'\n'}
            • Locked locations will unlock as you complete tasks{'\n'}
            • Use the right sidebar to access Contacts, Tasks, and Settings
          </Text>
        </View>

        <View className="mb-6">
          <Text className="text-lg font-bold mb-2">💬 Conversations</Text>
          <Text className="text-gray-600 leading-6">
            • Hold the microphone button to speak{'\n'}
            • Release to send your message{'\n'}
            • Your English will be evaluated{'\n'}
            • Building good relationships increases NPC affinity
          </Text>
        </View>

        <View className="mb-6">
          <Text className="text-lg font-bold mb-2">❤️ Affinity System</Text>
          <Text className="text-gray-600 leading-6">
            • Affinity represents your relationship with NPCs{'\n'}
            • Good conversations increase affinity{'\n'}
            • Higher affinity unlocks more content
          </Text>
        </View>

        <View className="mb-6">
          <Text className="text-lg font-bold mb-2">📝 Tasks</Text>
          <Text className="text-gray-600 leading-6">
            • Complete tasks to unlock new locations{'\n'}
            • Tasks help you practice different scenarios
          </Text>
        </View>

        <View className="mb-4">
          <Text className="text-lg font-bold mb-2">Need More Help?</Text>
          <Text className="text-gray-600 leading-6">
            Contact support or check our documentation online.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
