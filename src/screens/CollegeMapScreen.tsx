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
        style={{ width: screenWidth, height: screenHeight, backgroundColor: '#e8f5e9' }}
      >
        {/* Locations positioned absolutely on the map */}
        {Object.values(CollegeLocations).map((location) => {
          const isUnlocked = unlockedLocations.includes(location.id);
          const position = location.position || { x: 50, y: 150 };

          const scaleX = (screenWidth - 80) / 400;
          const scaleY = screenHeight / 400;
          const minScale = Math.min(scaleX, scaleY);

          // 根据屏幕尺寸动态计算建筑图标的大小。设计基准下为 110
          const buildingSize = 110 * minScale;

          // 动态计算定位，利用建筑宽度的一半来进行完美居中偏移
          const scaledX = position.x * scaleX - buildingSize / 2;
          const scaledY = position.y * scaleY - buildingSize / 2;

          // 动态计算文字大小、内边距和外边距，在大屏幕下依然保持优秀的比例
          const fontSize = Math.max(8, Math.round(11 * minScale));
          const px = Math.max(4, Math.round(8 * minScale));
          const py = Math.max(2, Math.round(4 * minScale));
          const mt = Math.max(1, Math.round(4 * minScale));

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
                    width: buildingSize,
                    height: buildingSize,
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
                      <Text style={{ fontSize: fontSize * 2.2 }}>🔒</Text>
                    </View>
                  )}
                </View>

                <View
                  className="bg-white/90 rounded-md shadow"
                  style={{
                    paddingHorizontal: px,
                    paddingVertical: py,
                    marginTop: mt,
                  }}
                >
                  <Text
                    className="font-bold text-gray-800"
                    style={{ fontSize: fontSize }}
                  >
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
          className="w-12 h-12 items-center justify-center mb-2"
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

        {/* Game Logo at bottom */}
        <Image
          source={require('../../assets/icon.png')}
          style={{ width: 40, height: 40, borderRadius: 8, marginTop: 8 }}
          resizeMode="contain"
        />
      </View>
    </View>
  );
}
