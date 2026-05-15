// src/screens/TasksScreen.tsx

import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useGameStore } from '../store/gameStore';
import { Tasks } from '../data/tasks';
import { TasksScreenNavigationProp } from '../types/navigation';

// 用于在保存进度还没产生新任务时，给 MVP demo 兜底展示的额外任务
// 结构与 data/tasks 中 Task 一致，便于 getTaskInfo 读取 rewards.description
const ExtraTasks = {
  say_hi_new_faces: {
    title: 'Say Hi to New Faces',
    description: 'Talk to 3 people around campus (0/3)',
    rewards: { description: 'Unlock more campus conversations' },
    difficulty: 'Easy' as const,
    icon: '👋'
  },
  meet_your_tutor: {
    title: 'Meet Your Tutor',
    description: 'Introduce yourself to your tutor Ethan',
    rewards: { description: 'Unlock academic support dialogue' },
    difficulty: 'Easy' as const,
    icon: '📚'
  },
  visit_student_centre: {
    title: 'Visit Student Centre',
    description: "Ask Mia for help at the student support desk",
    rewards: { description: 'Unlock student support resources' },
    difficulty: 'Easy' as const,
    icon: '🪪'
  }
};

const fallbackActiveTasks = ['say_hi_new_faces', 'meet_your_tutor', 'visit_student_centre'];

export default function TasksScreen() {
  const navigation = useNavigation<TasksScreenNavigationProp>();
  const { activeTasks, completedTasks, loadProgress } = useGameStore();

  // 如果存档里没有新任务（例如刚跳过 coffee 任务），用 fallback 任务避免任务页空白
  const displayActiveTasks = activeTasks.length > 0 ? activeTasks : fallbackActiveTasks;

  useEffect(() => {
    loadProgress();
  }, []);

  const getTaskInfo = (taskId: string) => {
    const task = Tasks[taskId] || ExtraTasks[taskId as keyof typeof ExtraTasks];
    if (task) {
      return {
        title: task.title,
        description: task.description,
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
            <Text className="text-blue-600 font-semibold text-sm">{displayActiveTasks.length} Active</Text>
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
            {displayActiveTasks.length === 0 ? (
              <View className="bg-white rounded-lg p-6 items-center">
                <Text className="text-4xl mb-2">✅</Text>
                <Text className="text-gray-500">No active tasks</Text>
              </View>
            ) : (
              <View className="gap-3">
                {displayActiveTasks.map((taskId) => {
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
                        <TouchableOpacity className="bg-blue-500 px-4 py-2 rounded-full">
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
