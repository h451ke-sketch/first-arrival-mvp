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

// Deterministic game stage and task progress solver (Self-healing & Progressive)
function solveGameProgress(completed: string[], npcAffinity: Record<string, NPCAffinity>): {
  activeTasks: string[];
  unlockedLocations: LocationId[];
  completedTasks: string[];
} {
  const completedTasks = unique(completed);
  let activeTasks: string[] = [];
  let unlockedLocations: LocationId[] = ['main-school', 'college-cafe'];

  // Stage 1: Guide to buy coffee
  if (!completedTasks.includes('buy-coffee')) {
    activeTasks = ['buy-coffee'];
    return { activeTasks, unlockedLocations, completedTasks };
  }

  // Stage 2: Campus support conversations (5 tasks, 4 locations)
  unlockedLocations = unique([
    ...unlockedLocations,
    'student-center',
    'counseling-room',
    'medical-center',
    'college-classroom',
  ] as LocationId[]);

  // say-hi-new-faces is completed if meet-tutor, student-center-help, talk-counsellor, and book-medical-appointment are all completed
  const campusConversationsDone = RequiredCampusConversationTaskIds.every(
    id => completedTasks.includes(id)
  );
  if (campusConversationsDone && !completedTasks.includes('say-hi-new-faces')) {
    completedTasks.push('say-hi-new-faces');
  }

  const campusStageDone = CampusStageTaskIds.every(
    id => completedTasks.includes(id)
  );

  if (!campusStageDone) {
    activeTasks = CampusStageTaskIds.filter(id => !completedTasks.includes(id));
    return { activeTasks, unlockedLocations, completedTasks };
  }

  // Stage 3: Life support conversations outside school (3 tasks, 3 locations)
  unlockedLocations = unique([
    ...unlockedLocations,
    'main-bank',
    'main-supermarket',
    'main-apartment',
  ] as LocationId[]);

  const lifeStageDone = LifeStageTaskIds.every(
    id => completedTasks.includes(id)
  );

  if (!lifeStageDone) {
    activeTasks = LifeStageTaskIds.filter(id => !completedTasks.includes(id));
    return { activeTasks, unlockedLocations, completedTasks };
  }

  // Stage 4: Affinity milestones (8 tasks)
  // Auto-complete affinity task if an NPC has reached affinity 30
  Object.entries(AffinityTaskByNPCId).forEach(([npcId, affinityTaskId]) => {
    const affinity = npcAffinity[npcId]?.currentAffinity ?? 0;
    if (affinity >= 30 && !completedTasks.includes(affinityTaskId)) {
      completedTasks.push(affinityTaskId);
    }
  });

  activeTasks = AffinityStageTaskIds.filter(id => !completedTasks.includes(id));

  return { activeTasks, unlockedLocations, completedTasks };
}

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

      const rawCompleted = [...state.completedTasks, taskId];
      const solved = solveGameProgress(rawCompleted, state.npcAffinity);

      return {
        completedTasks: solved.completedTasks,
        activeTasks: solved.activeTasks,
        unlockedLocations: solved.unlockedLocations,
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

      const updatedNPCAffinity = {
        ...state.npcAffinity,
        [npcId]: {
          ...current,
          currentAffinity: newAffinity,
          conversationCount: current.conversationCount + 1,
          lastInteraction: new Date(),
          relationshipLevel: getRelationshipLevel(newAffinity)
        }
      };

      // Re-run solver to auto-complete affinity task if it's unlocked and reached 30
      const solved = solveGameProgress(state.completedTasks, updatedNPCAffinity);

      return {
        npcAffinity: updatedNPCAffinity,
        completedTasks: solved.completedTasks,
        activeTasks: solved.activeTasks,
        unlockedLocations: solved.unlockedLocations,
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

        const rawCompleted = progress.completedTasks || [];
        const rawAffinity = progress.npcAffinity || {};

        // Run the solver to clean up and ensure self-healing task progression
        const solved = solveGameProgress(rawCompleted, rawAffinity);

        set({
          completedTasks: solved.completedTasks,
          activeTasks: solved.activeTasks,
          unlockedLocations: solved.unlockedLocations,
          npcAffinity: rawAffinity,
        });

        // Save healed progress back
        await AsyncStorage.setItem('@game_progress', JSON.stringify({
          completedTasks: solved.completedTasks,
          activeTasks: solved.activeTasks,
          unlockedLocations: solved.unlockedLocations,
          npcAffinity: rawAffinity,
        }));
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
      const solved = solveGameProgress([], {});

      set({
        unlockedLocations: solved.unlockedLocations,
        completedTasks: solved.completedTasks,
        activeTasks: solved.activeTasks,
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
