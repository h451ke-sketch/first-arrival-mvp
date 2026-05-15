// src/types/task.ts

export interface Task {
  id: string;
  title: string;
  description: string;
  icon: string;
  difficulty: 'Easy' | 'Normal' | 'Hard';

  // 关联的 NPC 和地点
  relatedNPCId?: string;
  relatedLocationId?: string;

  // 任务完成条件描述（给 AI 看的，用于判断任务是否完成）
  completionCriteria: string;

  // 任务进度跟踪（可选，用于需要多步骤的任务）
  progressTracking?: {
    type: 'conversation' | 'action' | 'collection';
    current: number;
    required: number;
  };

  // 奖励（暂时可选，以后再决定具体内容）
  rewards?: {
    unlockLocationIds?: string[];  // 支持解锁多个地点
    affinity?: { npcId: string; amount: number };
    description?: string;
  };

  // 任务解锁条件（暂时不用，预留字段）
  prerequisites?: string[];
}

export interface TaskProgress {
  taskId: string;
  status: 'active' | 'completed';
  startedAt: string;
  completedAt?: string;
  progress?: number;
}
