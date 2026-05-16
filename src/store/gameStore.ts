// src/store/gameStore.ts

import { create } from 'zustand';
import { LocationId, UserProgress } from '../types/game';
import { NPCAffinity } from '../types/npc';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Tasks,
  InitialActiveTasks,
  CampusStageTaskIds,
  RequiredCampusConversationTaskIds,
  LifeStageTaskIds,
  AffinityStageTaskIds,
  AffinityTaskByNPCId,
} from '../data/tasks';

interface GameState extends UserProgress {
  npcAffinity: Record<string, NPCAffinity>;

  // Actions
  unlockLocation: (locationId: LocationId) => void;
  completeTask: (taskId: string) => void;
  completeTasksForNPC: (npcId: string) => void;
  updateNPCAffinity: (npcId: string, change: number) => void;
  getNPCAffinity: (npcId: string) => number;
  loadProgress: () => Promise<void>;
  saveProgress: () => Promise<void>;
  resetProgress: () => Promise<void>;
}

const InitialUnlockedLocations: LocationId[] = ['main-school', 'college-cafe'];

const unique = <T,>(items: T[]): T[] => Array.from(new Set(items));

export const useGameStore = create<GameState>((set, get) => ({
  // Initial state
  unlockedLocations: InitialUnlockedLocations,
  completedTasks: [],
  activeTasks: InitialActiveTasks,
  npcAffinity: {},

  // Actions
  unlockLocation: (locationId) => {
    set((state) => ({
      unlockedLocations: unique([...state.unlockedLocations, locationId])
    }));
    get().saveProgress();
  },

  completeTask: (taskId) => {
    const task = Tasks[taskId];

    // Hard guard: affinity tasks can ONLY be completed when that NPC has affinity >= 30.
    // This prevents AI summary or NPC conversation auto-completion from marking them done too early.
    if (AffinityStageTaskIds.includes(taskId)) {
      const targetNpcId = Object.entries(AffinityTaskByNPCId).find(
        ([, affinityTaskId]) => affinityTaskId === taskId
      )?.[0];

      const currentAffinity = targetNpcId
        ? get().npcAffinity[targetNpcId]?.currentAffinity ?? 0
        : 0;

      if (currentAffinity < 30) {
        console.log(
          `[GameStore] Blocked affinity task completion: ${taskId}. Current affinity: ${currentAffinity}/30`
        );
        return;
      }
    }

    set((state) => {
      if (state.completedTasks.includes(taskId)) {
        return state;
      }

      let completedTasks = unique([...state.completedTasks, taskId]);
      let activeTasks = state.activeTasks.filter(id => id !== taskId);
      let unlockedLocations = [...state.unlockedLocations];

      // 1) After the coffee task, show the five campus tasks.
      if (taskId === 'buy-coffee') {
        activeTasks = unique([...activeTasks, ...CampusStageTaskIds]);

        unlockedLocations = unique([
          ...unlockedLocations,
          'student-center',
          'counseling-room',
          'medical-center',
          'college-classroom',
        ] as LocationId[]);
      }

      // 2) Say Hi to New Faces is an umbrella task:
      // it is completed when Ethan, Mia, Mindy, and Lily have all been visited.
      const campusConversationsDone = RequiredCampusConversationTaskIds.every(
        id => completedTasks.includes(id)
      );

      if (campusConversationsDone && !completedTasks.includes('say-hi-new-faces')) {
        completedTasks = unique([...completedTasks, 'say-hi-new-faces']);
        activeTasks = activeTasks.filter(id => id !== 'say-hi-new-faces');
      }

      // 3) After all campus-stage tasks are complete, unlock the life-stage tasks.
      const campusStageDone = CampusStageTaskIds.every(
        id => completedTasks.includes(id)
      );

      if (campusStageDone) {
        activeTasks = unique([...activeTasks, ...LifeStageTaskIds]);

        unlockedLocations = unique([
          ...unlockedLocations,
          'main-bank',
          'main-supermarket',
          'main-apartment',
        ] as LocationId[]);
      }

      // 4) ONLY after ALL THREE life-stage tasks are completed,
      // unlock the eight affinity tasks.
      const lifeStageDone = LifeStageTaskIds.every(
        id => completedTasks.includes(id)
      );

      const affinityAlreadyVisible = AffinityStageTaskIds.some(id =>
        activeTasks.includes(id) || completedTasks.includes(id)
      );

      if (lifeStageDone && !affinityAlreadyVisible) {
        console.log('[GameStore] Unlocking affinity stage tasks');

        activeTasks = unique([
          ...activeTasks,
          ...AffinityStageTaskIds
        ]);

        // If someone already has 30+ affinity,
        // instantly complete that task.
        Object.entries(AffinityTaskByNPCId).forEach(([npcId, affinityTaskId]) => {
          const affinity = state.npcAffinity[npcId]?.currentAffinity ?? 0;

          if (
            affinity >= 30 &&
            !completedTasks.includes(affinityTaskId)
          ) {
            completedTasks = unique([
              ...completedTasks,
              affinityTaskId
            ]);

            activeTasks = activeTasks.filter(
              id => id !== affinityTaskId
            );
          }
        });
      }

      // 5) Standard rewards from task definitions.
      if (task?.rewards?.unlockLocationIds) {
        unlockedLocations = unique([
          ...unlockedLocations,
          ...(task.rewards.unlockLocationIds as LocationId[]),
        ]);
      }

      return {
        completedTasks,
        activeTasks,
        unlockedLocations,
      };
    });

    if (task?.rewards?.affinity) {
      get().updateNPCAffinity(task.rewards.affinity.npcId, task.rewards.affinity.amount);
    }

    get().saveProgress();
  },

  completeTasksForNPC: (npcId) => {
    const state = get();

    const matchingActiveTaskIds = state.activeTasks.filter(taskId => {
      const task = Tasks[taskId];

      // Do not auto-complete affinity tasks just because the learner talked to the NPC.
      // Affinity tasks are completed only by updateNPCAffinity when currentAffinity >= 30.
      if (AffinityStageTaskIds.includes(taskId)) {
        return false;
      }

      return task?.relatedNPCId === npcId;
    });

    console.log('[GameStore] completeTasksForNPC', npcId, matchingActiveTaskIds);

    matchingActiveTaskIds.forEach(taskId => {
      if (!get().completedTasks.includes(taskId)) {
        get().completeTask(taskId);
      }
    });

    get().saveProgress();
  },

  updateNPCAffinity: (npcId, change) => {
    let newAffinity = 0;

    set((state) => {
      const current = state.npcAffinity[npcId] || {
        npcId,
        currentAffinity: 0,
        conversationCount: 0,
        lastInteraction: new Date(),
        relationshipLevel: 'stranger' as const
      };

      newAffinity = Math.max(0, Math.min(100, current.currentAffinity + change));

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

    const affinityTaskId = AffinityTaskByNPCId[npcId];
    const state = get();

    if (
      affinityTaskId &&
      newAffinity >= 30 &&
      state.activeTasks.includes(affinityTaskId) &&
      !state.completedTasks.includes(affinityTaskId)
    ) {
      get().completeTask(affinityTaskId);
      return;
    }

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

        progress.unlockedLocations = unique([
          ...InitialUnlockedLocations,
          ...(progress.unlockedLocations || []),
        ]);

        progress.completedTasks = unique(progress.completedTasks || []);
        progress.activeTasks = unique(progress.activeTasks || InitialActiveTasks);
        progress.npcAffinity = progress.npcAffinity || {};

        // Clean old saved progress:
        // Remove any affinity task that was completed by mistake when the NPC affinity is still below 30.
        progress.completedTasks = progress.completedTasks.filter((taskId: string) => {
          if (!AffinityStageTaskIds.includes(taskId)) {
            return true;
          }

          const npcId = Object.entries(AffinityTaskByNPCId).find(
            ([, affinityTaskId]) => affinityTaskId === taskId
          )?.[0];

          const currentAffinity = npcId
            ? progress.npcAffinity[npcId]?.currentAffinity ?? 0
            : 0;

          return currentAffinity >= 30;
        });

        const lifeStageDoneOnLoad = LifeStageTaskIds.every(id =>
          progress.completedTasks.includes(id)
        );

        // Do not show affinity tasks before all three life-stage tasks are complete.
        // Do not keep completed tasks inside activeTasks.
        progress.activeTasks = progress.activeTasks.filter((taskId: string) => {
          const isCompleted = progress.completedTasks.includes(taskId);
          const isAffinityTask = AffinityStageTaskIds.includes(taskId);
          return !isCompleted && (lifeStageDoneOnLoad || !isAffinityTask);
        });

        // If all three life-stage tasks are complete, show unfinished affinity tasks.
        if (lifeStageDoneOnLoad) {
          const unfinishedAffinityTasks = AffinityStageTaskIds.filter((taskId: string) => {
            if (progress.completedTasks.includes(taskId)) {
              return false;
            }

            const npcId = Object.entries(AffinityTaskByNPCId).find(
              ([, affinityTaskId]) => affinityTaskId === taskId
            )?.[0];

            const currentAffinity = npcId
              ? progress.npcAffinity[npcId]?.currentAffinity ?? 0
              : 0;

            return currentAffinity < 30;
          });

          progress.activeTasks = unique([
            ...progress.activeTasks,
            ...unfinishedAffinityTasks,
          ]);
        }

        set(progress);

        // Save the cleaned progress so wrongly completed affinity tasks do not come back.
        await AsyncStorage.setItem('@game_progress', JSON.stringify(progress));
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
      set({
        unlockedLocations: InitialUnlockedLocations,
        completedTasks: [],
        activeTasks: InitialActiveTasks,
        npcAffinity: {}
      });

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
