// src/screens/TasksScreen.tsx

import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useGameStore } from '../store/gameStore';
import { Tasks, LifeStageTaskIds, AffinityStageTaskIds } from '../data/tasks';
import { TasksScreenNavigationProp } from '../types/navigation';


const CampusConversationTasks = [
  'meet-tutor',
  'student-center-help',
  'talk-counsellor',
  'book-medical-appointment',
];

const fallbackActiveTasks: string[] = [];

export default function TasksScreen() {
  const navigation = useNavigation<TasksScreenNavigationProp>();
  const { activeTasks, completedTasks, loadProgress } = useGameStore();

  const sayHiProgress = CampusConversationTasks.filter(taskId =>
    completedTasks.includes(taskId)
  ).length;

  useEffect(() => {
    loadProgress();
  }, []);

  const getTaskInfo = (taskId: string) => {
    const task = Tasks[taskId];
    if (task) {
      const dynamicDescription =
        taskId === 'say-hi-new-faces'
          ? `Talk to 4 people around campus (${sayHiProgress}/4)`
          : task.description;

      return {
        title: task.title,
        description: dynamicDescription,
        reward: task.rewards?.description || 'Complete this task',
        difficulty: task.difficulty,
        icon: task.icon
      };
    }
    return {
      title: taskId,
      description: 'Complete this task',
      reward: 'Unknown',
      difficulty: 'Normal' as const,
      icon: '📋'
    };
  };

  return (
    <View className="flex-1 bg-pink-50">
      {/* Header */}
      <View className="bg-white px-6 py-4 shadow-sm flex-row items-center justify-between border-b border-gray-200">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text className="text-blue-500 text-lg">← Back</Text>
          </TouchableOpacity>
          <Text className="text-xl font-bold">Tasks</Text>
        </View>
        <View className="flex-row gap-2">
          <View className="bg-blue-100 px-3 py-1 rounded-full">
            <Text className="text-blue-600 font-semibold text-sm">{activeTasks.length} Active</Text>
          </View>
          <View className="bg-green-100 px-3 py-1 rounded-full">
            <Text className="text-green-600 font-semibold text-sm">{completedTasks.length} Done</Text>
          </View>
        </View>
      </View>

      {/* Tasks Content - Two Column Layout */}
      <View className="flex-1 flex-row p-4 gap-4">
        {/* Left Column - Active Tasks */}
        <View className="flex-1">
          <View className="bg-white rounded-lg p-4 mb-3 shadow-sm">
            <Text className="text-lg font-bold mb-1">📝 Active Tasks</Text>
            <Text className="text-sm text-gray-500">Complete these to progress</Text>
          </View>

          <ScrollView className="flex-1">
            {activeTasks.length === 0 ? (
              <View className="bg-white rounded-lg p-6 items-center">
                <Text className="text-4xl mb-2">✅</Text>
                <Text className="text-gray-500">No active tasks</Text>
              </View>
            ) : (
              <View className="gap-3">
                {activeTasks.map((taskId) => {
                  const task = getTaskInfo(taskId);
                  return (
                    <View key={taskId} className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-blue-500">
                      <View className="flex-row items-start justify-between mb-2">
                        <View className="flex-row items-center gap-2 flex-1">
                          <Text className="text-2xl">{task.icon}</Text>
                          <Text className="text-base font-bold flex-1">{task.title}</Text>
                        </View>
                        <View className="bg-blue-100 px-2 py-1 rounded">
                          <Text className="text-xs text-blue-600 font-semibold">{task.difficulty}</Text>
                        </View>
                      </View>

                      <Text className="text-sm text-gray-600 mb-3">{task.description}</Text>

                      <View className="flex-row items-center justify-between border-t border-gray-100 pt-3">
                        <View className="flex-row items-center gap-1">
                          <Text className="text-sm text-gray-500">Reward:</Text>
                          <Text className="text-sm font-semibold text-green-600">{task.reward}</Text>
                        </View>
                        <TouchableOpacity className="bg-blue-500 px-4 py-2 rounded-full" onPress={() => navigation.goBack()}>
                          <Text className="text-white text-xs font-bold">Go</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </ScrollView>
        </View>

        {/* Right Column - Completed Tasks */}
        <View className="flex-1">
          <View className="bg-white rounded-lg p-4 mb-3 shadow-sm">
            <Text className="text-lg font-bold mb-1">✅ Completed Tasks</Text>
            <Text className="text-sm text-gray-500">Your achievements</Text>
          </View>

          <ScrollView className="flex-1">
            {completedTasks.length === 0 ? (
              <View className="bg-white rounded-lg p-6 items-center">
                <Text className="text-4xl mb-2">🎯</Text>
                <Text className="text-gray-500">No completed tasks yet</Text>
              </View>
            ) : (
              <View className="gap-3">
                {completedTasks.map((taskId) => {
                  const task = getTaskInfo(taskId);
                  return (
                    <View key={taskId} className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-green-500 opacity-75">
                      <View className="flex-row items-center gap-2 mb-2">
                        <Text className="text-xl opacity-50">{task.icon}</Text>
                        <Text className="text-base font-bold text-gray-600 flex-1">{task.title}</Text>
                        <Text className="text-2xl">✓</Text>
                      </View>
                      <Text className="text-sm text-gray-500">{task.description}</Text>
                    </View>
                  );
                })}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </View>
  );
}
