// src/store/gameStore.ts

import { create } from 'zustand';
import { LocationId, UserProgress } from '../types/game';
import { NPCAffinity } from '../types/npc';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Tasks } from '../data/tasks';

interface GameState extends UserProgress {
  npcAffinity: Record<string, NPCAffinity>;

  // Actions
  unlockLocation: (locationId: LocationId) => void;
  completeTask: (taskId: string) => void;
  updateNPCAffinity: (npcId: string, change: number) => void;
  getNPCAffinity: (npcId: string) => number;
  loadProgress: () => Promise<void>;
  saveProgress: () => Promise<void>;
  resetProgress: () => Promise<void>;
}

export const useGameStore = create<GameState>((set, get) => ({
  // Initial state
  unlockedLocations: ['main-school', 'college-cafe'],
  completedTasks: [],
  activeTasks: ['buy-coffee'],
  npcAffinity: {},
  
  // Actions
  unlockLocation: (locationId) => {
    set((state) => ({
      unlockedLocations: [...state.unlockedLocations, locationId]
    }));
    get().saveProgress();
  },
  
  completeTask: (taskId) => {
    const task = Tasks[taskId];

    set((state) => ({
      completedTasks: [...state.completedTasks, taskId],
      activeTasks: state.activeTasks.filter(id => id !== taskId)
    }));

    // 发放任务奖励
    if (task?.rewards) {
      // 解锁地点奖励（支持多个地点）
      if (task.rewards.unlockLocationIds) {
        task.rewards.unlockLocationIds.forEach(locationId => {
          get().unlockLocation(locationId as LocationId);
        });
      }

      // 好感度奖励
      if (task.rewards.affinity) {
        get().updateNPCAffinity(task.rewards.affinity.npcId, task.rewards.affinity.amount);
      }
    }

    get().saveProgress();
  },
  
  updateNPCAffinity: (npcId, change) => {
    set((state) => {
      const current = state.npcAffinity[npcId] || {
        npcId,
        currentAffinity: 0,
        conversationCount: 0,
        lastInteraction: new Date(),
        relationshipLevel: 'stranger' as const
      };
      
      const newAffinity = Math.max(0, Math.min(100, current.currentAffinity + change));
      
      return {
        npcAffinity: {
          ...state.npcAffinity,
          [npcId]: {
            ...current,
            currentAffinity: newAffinity,
            conversationCount: current.conversationCount + 1,
            lastInteraction: new Date(),
            relationshipLevel: getRelationshipLevel(newAffinity)
          }
        }
      };
    });
    get().saveProgress();
  },
  
  getNPCAffinity: (npcId) => {
    const affinity = get().npcAffinity[npcId];
    return affinity?.currentAffinity ?? 0;
  },
  
  loadProgress: async () => {
    try {
      const saved = await AsyncStorage.getItem('@game_progress');
      if (saved) {
        const progress = JSON.parse(saved);
        // 确保 main-school 始终解锁
        if (!progress.unlockedLocations?.includes('main-school')) {
          progress.unlockedLocations = ['main-school', ...(progress.unlockedLocations || [])];
        }
        set(progress);
      }
    } catch (error) {
      console.error('Failed to load progress:', error);
    }
  },
  
  saveProgress: async () => {
    try {
      const state = get();
      const toSave = {
        unlockedLocations: state.unlockedLocations,
        completedTasks: state.completedTasks,
        activeTasks: state.activeTasks,
        npcAffinity: state.npcAffinity
      };
      await AsyncStorage.setItem('@game_progress', JSON.stringify(toSave));
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
  },

  resetProgress: async () => {
    try {
      // 重置为初始状态
      set({
        unlockedLocations: ['main-school', 'college-cafe'],
        completedTasks: [],
        activeTasks: ['buy-coffee'],
        npcAffinity: {}
      });

      // 清除 AsyncStorage
      await AsyncStorage.removeItem('@game_progress');

      console.log('[GameStore] Progress reset successfully');
    } catch (error) {
      console.error('Failed to reset progress:', error);
      throw error;
    }
  }
}));

function getRelationshipLevel(affinity: number): NPCAffinity['relationshipLevel'] {
  if (affinity < 30) return 'stranger';
  if (affinity < 60) return 'acquaintance';
  if (affinity < 85) return 'friend';
  return 'close-friend';
}
