// src/screens/CollegeMapScreen.tsx

import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, ImageBackground, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useGameStore } from '../store/gameStore';
import { CollegeLocations } from '../data/locations';
import { CollegeMapScreenNavigationProp } from '../types/navigation';
import { useStageDimensions } from '../utils/stage';
import { playBGM } from '../services/audioService';

export default function CollegeMapScreen() {
  const navigation = useNavigation<CollegeMapScreenNavigationProp>();
  const { unlockedLocations } = useGameStore();

  const { width: screenWidth, height: screenHeight } = useStageDimensions();

  useEffect(() => {
    playBGM('main');
  }, []);

  const handleLocationPress = (locationId: string) => {
    const location = CollegeLocations[locationId];

    if (!unlockedLocations.includes(locationId as any)) {
      alert('This location is locked. Complete tasks to unlock!');
      return;
    }

    navigation.navigate('Dialogue', {
      locationId,
      npcId: location.npcId
    });
  };

  return (
    <View className="flex-1">
      <ImageBackground
        source={require('../../assets/CollegeMAP.png')}
        className="flex-1"
        resizeMode="cover"
        style={{ width: screenWidth, height: screenHeight }}
      >
        {/* Locations positioned absolutely on the map */}
        {Object.values(CollegeLocations).map((location) => {
          const isUnlocked = unlockedLocations.includes(location.id);
          const position = location.position || { x: 50, y: 150 };

          const scaleX = (screenWidth - 80) / 400;
          const scaleY = screenHeight / 400;
          const scaledX = position.x * scaleX - 50;
          const scaledY = position.y * scaleY - 50;

          return (
            <TouchableOpacity
              key={location.id}
              onPress={() => handleLocationPress(location.id)}
              disabled={!isUnlocked}
              style={{
                position: 'absolute',
                left: scaledX,
                top: scaledY,
              }}
            >
              <View className="items-center">
                <View
                  style={{
                    width: 130,
                    height: 130,
                    opacity: isUnlocked ? 1 : 0.5,
                  }}
                >
                  <Image
                    source={location.image}
                    style={{ width: '100%', height: '100%', borderRadius: 8 }}
                    resizeMode="contain"
                  />

                  {!isUnlocked && (
                    <View className="absolute inset-0 items-center justify-center bg-black/50 rounded-lg">
                      <Text className="text-4xl">🔒</Text>
                    </View>
                  )}
                </View>

                <View className="bg-white/90 px-2 py-1 rounded-md mt-1 shadow">
                  <Text className="text-[10px] font-bold text-gray-800">
                    {location.displayName.en}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ImageBackground>

      {/* Right Side Navigation Bar */}
      <View className="absolute top-0 right-0 bottom-0 w-20 bg-white/90 py-6 flex-col items-center justify-start">
        {/* Back to main map */}
        <TouchableOpacity
          className="w-12 h-12 items-center justify-center mb-4"
          onPress={() => navigation.goBack()}
        >
          <Text className="text-2xl">🗺️</Text>
          <Text className="text-[8px] text-gray-600 mt-0.5">Map</Text>
        </TouchableOpacity>

        <View className="flex-1 flex-col items-center justify-evenly">
          <TouchableOpacity
            className="w-12 h-12 items-center justify-center"
            onPress={() => navigation.navigate('Contacts')}
          >
            <Text className="text-2xl">📞</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="w-12 h-12 items-center justify-center"
            onPress={() => navigation.navigate('Tasks')}
          >
            <Text className="text-2xl">📖</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="w-12 h-12 items-center justify-center"
            onPress={() => navigation.navigate('Settings')}
          >
            <Text className="text-2xl">⚙️</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
