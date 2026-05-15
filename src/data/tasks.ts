// src/data/tasks.ts

import { Task } from '../types/task';

export const Tasks: Record<string, Task> = {
  'buy-coffee': {
    id: 'buy-coffee',
    title: 'Order Coffee at Campus Cafe',
    description: 'Practice ordering coffee from Jack at the Campus Cafe',
    icon: '☕',
    difficulty: 'Easy',
    relatedNPCId: 'jack',
    relatedLocationId: 'college-cafe',
    completionCriteria: 'The user asked for or ordered any type of coffee from Jack. Simply requesting a coffee counts as completion.',
    rewards: {
      unlockLocationIds: [
        'main-supermarket',
        'main-apartment',
        'main-bank',
        'student-center',
        'counseling-room',
        'medical-center',
        'college-classroom',
      ],
      description: 'Unlock all locations'
    }
  },

  'student-center-help': {
    id: 'student-center-help',
    title: 'Get Help at Student Center',
    description: 'Ask Mia for help at the Student Center',
    icon: '🏫',
    difficulty: 'Normal',
    relatedNPCId: 'mia',
    relatedLocationId: 'student-center',
    completionCriteria: 'The user successfully asked Mia for help at the Student Center. They should have introduced themselves, asked about available services or resources, and understood the information provided.',
    rewards: {
      description: 'Access student center resources'
    }
  },

  'meet-tutor': {
    id: 'meet-tutor',
    title: 'Meet Your Tutor',
    description: 'Introduce yourself to Ethan in the classroom',
    icon: '👋',
    difficulty: 'Easy',
    relatedNPCId: 'ethan',
    relatedLocationId: 'college-classroom',
    completionCriteria: 'The user successfully introduced themselves to Ethan and had a basic conversation. They should have exchanged names, talked about their background or interests, and established a friendly connection.',
    rewards: {
      affinity: { npcId: 'ethan', amount: 10 },
      description: 'Friendship +10'
    }
  },

  'open-bank-account': {
    id: 'open-bank-account',
    title: 'Open a Bank Account',
    description: 'Open a student bank account with Mark at the bank',
    icon: '🏦',
    difficulty: 'Hard',
    relatedNPCId: 'mark',
    relatedLocationId: 'bank',
    completionCriteria: 'The user successfully opened a bank account with Mark. They should have asked about opening an account, understood what documents are needed (passport, student ID, proof of address), and completed the account opening process.',
    rewards: {
      description: 'Bank account opened'
    }
  },
};

// 初始活跃任务列表
export const InitialActiveTasks = ['buy-coffee'];
