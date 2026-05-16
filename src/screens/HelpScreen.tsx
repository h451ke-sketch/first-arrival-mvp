import React from 'react';
import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function HelpScreen() {
  const navigation = useNavigation();

  return (
    <View className="flex-1 bg-white">
      <View className="bg-white px-5 pt-5 pb-4 border-b border-gray-200 flex-row items-center">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
          <Text className="text-blue-500 text-lg">← Back</Text>
        </TouchableOpacity>
        <Text className="text-2xl font-bold">Help & Support</Text>
      </View>

      <ScrollView className="flex-1 px-5 pt-6">
        <View className="mb-6 bg-blue-50 p-4 rounded-2xl">
          <Text className="text-lg font-bold mb-2">
            🔑 API Setup (Unlimited Conversations)
          </Text>
          <Text className="text-gray-600 leading-6">
            • Free users have limited conversations{"\n\n"}
            • To continue using unlimited conversations, please add your own DeepSeek API Key{"\n\n"}
            Step 1: Visit the DeepSeek website and create an account{"\n"}
            Step 2: Generate your API Key in DeepSeek{"\n"}
            Step 3: Add a small balance to your DeepSeek account (usually very low cost){"\n"}
            Step 4: Copy your API Key{"\n"}
            Step 5: Go to Settings → Paste API Key → Save{"\n\n"}
            Your API key is stored locally on your device and is not shared.
          </Text>
        </View>

        <View className="mb-6 bg-pink-50 p-4 rounded-2xl">
          <Text className="text-lg font-bold mb-2">
            🎓 About First Arrival
          </Text>
          <Text className="text-gray-600 leading-6">
            First Arrival is an educational English-speaking simulation designed to help international students adapt to studying in Australia through real-life communication practice.{"\n\n"}
            This project was developed as part of LNGS7528: Dissertation Part 1 and LNGS7529: Dissertation Part 2 at the University of Sydney.{"\n\n"}
            Special thanks to Professor Sunny-Boy Ahmar Mahboob for his valuable guidance and support throughout LNGS7528: Dissertation Part 1 and LNGS7529: Dissertation Part 2.
          </Text>
        </View>

        <View className="mb-8 bg-green-50 p-4 rounded-2xl">
          <Text className="text-lg font-bold mb-2">
            📧 Contact Support
          </Text>
          <Text className="text-gray-600 leading-6">
            For technical support or feedback:{"\n\n"}
            1017917643@qq.com{"\n\n"}
            We welcome feedback to improve the learning experience.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
