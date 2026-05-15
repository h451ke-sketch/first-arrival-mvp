// src/types/game.ts

export type LocationId =
  // 主地图
  | 'main-school'
  | 'main-supermarket'
  | 'main-apartment'
  | 'main-bank'
  // 学校副地图
  | 'student-center'
  | 'counseling-room'
  | 'medical-center'
  | 'college-classroom'
  | 'college-cafe';

export interface Location {
  id: LocationId;
  name: string;
  displayName: {
    en: string;
    zh: string;
  };
  image: any;
  icon?: any;
  npcId: string;
  position?: {
    x: number;
    y: number;
  };
  unlocked: boolean;
}

export interface Task {
  id: string;
  title: {
    en: string;
    zh: string;
  };
  description: {
    en: string;
    zh: string;
  };
  location: LocationId;
  npcId: string;
  objectives: string[];
  requiredAffinity?: number;
  completed: boolean;
}

export interface UserProgress {
  unlockedLocations: LocationId[];
  completedTasks: string[];
  activeTasks: string[];
}
