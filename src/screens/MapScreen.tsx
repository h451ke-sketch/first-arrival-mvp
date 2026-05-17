// src/screens/MapScreen.tsx

import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, ImageBackground, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useGameStore } from '../store/gameStore';
import { MainMapLocations } from '../data/locations';
import { MapScreenNavigationProp } from '../types/navigation';
import { playBGM } from '../services/audioService';
import { useStageDimensions } from '../utils/stage';

export default function MapScreen() {
  const navigation = useNavigation<MapScreenNavigationProp>();
  const { unlockedLocations, loadProgress } = useGameStore();

  // 用 stage 尺寸代替 viewport 尺寸：native 端等同 useWindowDimensions，
  // web 端返回横屏 letterbox 画布的实际像素尺寸
  const { width: screenWidth, height: screenHeight } = useStageDimensions();

  useEffect(() => {
    loadProgress();
    playBGM('main');
  }, []);

  const handleLocationPress = (locationId: string) => {
    const location = MainMapLocations[locationId];

    if (!unlockedLocations.includes(locationId as any)) {
      alert('This location is locked. Complete tasks to unlock!');
      return;
    }

    // 学校跳转至学校副地图
    if (locationId === 'main-school') {
      navigation.navigate('CollegeMap');
      return;
    }

    navigation.navigate('Dialogue', {
      locationId,
      npcId: location.npcId
    });
  };

  return (
    <View className="flex-1">
      {/* Map Background with Locations */}
      <ImageBackground
        source={require('../../assets/MAP.png')}
        className="flex-1"
        resizeMode="cover"
        style={{
          width: screenWidth,
          height: screenHeight,
          overflow: 'hidden',
        }}
      >
        {/* Locations positioned absolutely on the map */}
        {Object.values(MainMapLocations).map((location) => {
          const isUnlocked = unlockedLocations.includes(location.id);
          const position = location.position || { x: 50, y: 150 };

          // 设计基准 400x400；右侧 80px 导航栏。resizeMode=cover 下地图铺满 stage，按线性比例缩放标记
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
                {/* Location Building Icon */}
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

                  {/* Lock Overlay */}
                  {!isUnlocked && (
                    <View className="absolute inset-0 items-center justify-center bg-black/50 rounded-lg">
                      <Text style={{ fontSize: fontSize * 2.2 }}>🔒</Text>
                    </View>
                  )}
                </View>

                {/* Location Name Tag */}
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
      <View className="absolute top-0 right-0 bottom-0 w-20 bg-white/90 py-4 flex-col items-center justify-start">
        {/* Game Logo */}
        <Image
          source={require('../../assets/icon.png')}
          style={{ width: 44, height: 44, marginBottom: 6, borderRadius: 8 }}
          resizeMode="contain"
        />

        {/* 旋转 -90deg：用固定宽高 wrapper 限定布局尺寸，内层 Text 自由排版后变换 */}
        <View
          className="items-center justify-center mb-2"
          style={{ width: 80, height: 180 }}
        >
          <Text
            className="text-sm font-bold text-gray-800"
            style={{
              width: 200,
              textAlign: 'center',
              transform: [{ rotate: '-90deg' }],
            }}
          >
            First Arrival: Australia
          </Text>
        </View>

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
