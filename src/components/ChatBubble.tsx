// src/components/ChatBubble.tsx

import React from 'react';
import { View, Text } from 'react-native';
import { Message } from '../types/conversation';

interface ChatBubbleProps {
  message: Message;
  isUser: boolean;
}

export default function ChatBubble({ message, isUser }: ChatBubbleProps) {
  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };
  
  return (
    <View className={`flex-row mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <View 
        className={`max-w-[75%] p-3 rounded-lg ${
          isUser 
            ? 'bg-green-200 rounded-br-none' 
            : 'bg-white rounded-bl-none shadow-sm'
        }`}
      >
        {/* Message Content */}
        <Text className="text-base text-gray-800">{message.content}</Text>
        
        {/* User message: show feedback if any errors */}
        {isUser && message.feedback?.hasError && (
          <View className="mt-2 p-2 bg-yellow-100 rounded border-l-2 border-yellow-400">
            <Text className="text-sm text-yellow-800 font-semibold mb-1">
              💡 Tip
            </Text>
            <Text className="text-sm text-gray-700">
              {message.feedback.suggestion}
            </Text>
            {message.feedback.correctedVersion && (
              <Text className="text-sm text-gray-600 mt-1 italic">
                Try: "{message.feedback.correctedVersion}"
              </Text>
            )}
          </View>
        )}
        
        {/* NPC message: show affinity change */}
        {!isUser && message.affinityChange !== undefined && message.affinityChange !== 0 && (
          <View className="flex-row items-center mt-2">
            <Text className={`text-sm font-semibold ${
              message.affinityChange > 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {message.affinityChange > 0 ? '❤️ ' : '💔 '}
              {message.affinityChange > 0 ? '+' : ''}
              {message.affinityChange}
            </Text>
          </View>
        )}
        
        {/* Timestamp */}
        <Text className="text-xs text-gray-500 mt-1">
          {formatTime(message.timestamp)}
        </Text>
      </View>
    </View>
  );
}
