// src/data/tasks.ts

import { Task } from '../types/task';

export const CampusStageTaskIds = [
  'say-hi-new-faces',
  'meet-tutor',
  'student-center-help',
  'talk-counsellor',
  'book-medical-appointment',
];

export const RequiredCampusConversationTaskIds = [
  'meet-tutor',
  'student-center-help',
  'talk-counsellor',
  'book-medical-appointment',
];

export const LifeStageTaskIds = [
  'open-bank-account',
  'buy-first-groceries',
  'report-maintenance-issue',
];

export const AffinityStageTaskIds = [
  'reach-affinity-jack',
  'reach-affinity-ethan',
  'reach-affinity-mia',
  'reach-affinity-mindy',
  'reach-affinity-lily',
  'reach-affinity-mark',
  'reach-affinity-michael',
  'reach-affinity-cecilia',
];

export const AffinityTaskByNPCId: Record<string, string> = {
  jack: 'reach-affinity-jack',
  ethan: 'reach-affinity-ethan',
  mia: 'reach-affinity-mia',
  mindy: 'reach-affinity-mindy',
  lily: 'reach-affinity-lily',
  mark: 'reach-affinity-mark',
  michael: 'reach-affinity-michael',
  cecilia: 'reach-affinity-cecilia',
};

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
        'student-center',
        'counseling-room',
        'medical-center',
        'college-classroom',
      ],
      description: 'Unlock campus support conversations'
    }
  },

  'say-hi-new-faces': {
    id: 'say-hi-new-faces',
    title: 'Say Hi to New Faces',
    description: 'Talk to 4 people around campus (0/4)',
    icon: '👋',
    difficulty: 'Easy',
    relatedLocationId: 'main-school',
    completionCriteria: 'This task is completed automatically after the student has talked to Ethan, Mia, Mindy, and Lily. Jack does not count because the student has already met him during the coffee task.',
    rewards: {
      description: 'Unlock more campus conversations'
    }
  },

  'meet-tutor': {
    id: 'meet-tutor',
    title: 'Meet Your Tutor',
    description: 'Introduce yourself to your tutor Ethan',
    icon: '📚',
    difficulty: 'Easy',
    relatedNPCId: 'ethan',
    relatedLocationId: 'college-classroom',
    completionCriteria: 'The user successfully introduced themselves to Ethan and had a basic conversation. They should greet Ethan, say their name or background, and ask or answer at least one simple academic question.',
    rewards: {
      description: 'Unlock academic support dialogue'
    }
  },

  'student-center-help': {
    id: 'student-center-help',
    title: 'Visit Student Centre',
    description: 'Ask Mia for help at the student support desk',
    icon: '🪪',
    difficulty: 'Easy',
    relatedNPCId: 'mia',
    relatedLocationId: 'student-center',
    completionCriteria: 'The user successfully asked Mia for help at the Student Centre. They should greet Mia, explain that they are a new student, and ask about at least one available service or resource.',
    rewards: {
      description: 'Unlock student support resources'
    }
  },

  'talk-counsellor': {
    id: 'talk-counsellor',
    title: 'Talk to the Counsellor',
    description: 'Visit Mindy and talk about adjusting to student life',
    icon: '🧠',
    difficulty: 'Easy',
    relatedNPCId: 'mindy',
    relatedLocationId: 'counseling-room',
    completionCriteria: 'The user successfully talked to Mindy about student life adjustment, stress, homesickness, loneliness, language anxiety, or wellbeing support.',
    rewards: {
      description: 'Unlock wellbeing and stress support'
    }
  },

  'book-medical-appointment': {
    id: 'book-medical-appointment',
    title: 'Book a Medical Appointment',
    description: 'Ask Lily how to make a medical appointment',
    icon: '🩺',
    difficulty: 'Easy',
    relatedNPCId: 'lily',
    relatedLocationId: 'medical-center',
    completionCriteria: 'The user successfully asked Lily about making a medical appointment or described a simple health concern. They should ask what to do next or what information is needed.',
    rewards: {
      description: 'Unlock healthcare support tips'
    }
  },

  'open-bank-account': {
    id: 'open-bank-account',
    title: 'Open a Bank Account',
    description: 'Ask Mark how to open a bank account',
    icon: '🏦',
    difficulty: 'Normal',
    relatedNPCId: 'mark',
    relatedLocationId: 'main-bank',
    completionCriteria: 'The user asked Mark about opening a bank account. Any clear request about opening a bank account counts as completion.',
    rewards: {
      description: 'Unlock financial support resources'
    }
  },

  'buy-first-groceries': {
    id: 'buy-first-groceries',
    title: 'Buy Your First Groceries',
    description: 'Ask Michael for help finding daily essentials',
    icon: '🛒',
    difficulty: 'Normal',
    relatedNPCId: 'michael',
    relatedLocationId: 'main-supermarket',
    completionCriteria: 'The user asked Michael for help with groceries, daily items, supermarket products, checkout, or finding something in the supermarket. Any clear grocery-related request counts as completion.',
    rewards: {
      description: 'Unlock supermarket conversations'
    }
  },

  'report-maintenance-issue': {
    id: 'report-maintenance-issue',
    title: 'Report a Maintenance Issue',
    description: 'Tell Cecilia about a problem in your apartment',
    icon: '🏠',
    difficulty: 'Normal',
    relatedNPCId: 'cecilia',
    relatedLocationId: 'main-apartment',
    completionCriteria: 'The user told Cecilia about any apartment problem or maintenance issue, such as broken light, internet problem, water issue, noise, keys, door, heater, or anything not working. Any clear housing problem report counts as completion.',
    rewards: {
      description: 'Unlock housing support'
    }
  },

  'reach-affinity-jack': {
    id: 'reach-affinity-jack',
    title: 'Build Trust with Jack',
    description: 'Reach affinity 30 with Jack',
    icon: '☕',
    difficulty: 'Normal',
    relatedNPCId: 'jack',
    relatedLocationId: 'college-cafe',
    completionCriteria: 'This task is completed automatically when Jack reaches affinity 30.',
    rewards: {
      description: 'Jack affinity milestone'
    }
  },

  'reach-affinity-ethan': {
    id: 'reach-affinity-ethan',
    title: 'Build Trust with Ethan',
    description: 'Reach affinity 30 with Ethan',
    icon: '📚',
    difficulty: 'Normal',
    relatedNPCId: 'ethan',
    relatedLocationId: 'college-classroom',
    completionCriteria: 'This task is completed automatically when Ethan reaches affinity 30.',
    rewards: {
      description: 'Ethan affinity milestone'
    }
  },

  'reach-affinity-mia': {
    id: 'reach-affinity-mia',
    title: 'Build Trust with Mia',
    description: 'Reach affinity 30 with Mia',
    icon: '🪪',
    difficulty: 'Normal',
    relatedNPCId: 'mia',
    relatedLocationId: 'student-center',
    completionCriteria: 'This task is completed automatically when Mia reaches affinity 30.',
    rewards: {
      description: 'Mia affinity milestone'
    }
  },

  'reach-affinity-mindy': {
    id: 'reach-affinity-mindy',
    title: 'Build Trust with Mindy',
    description: 'Reach affinity 30 with Mindy',
    icon: '🧠',
    difficulty: 'Normal',
    relatedNPCId: 'mindy',
    relatedLocationId: 'counseling-room',
    completionCriteria: 'This task is completed automatically when Mindy reaches affinity 30.',
    rewards: {
      description: 'Mindy affinity milestone'
    }
  },

  'reach-affinity-lily': {
    id: 'reach-affinity-lily',
    title: 'Build Trust with Lily',
    description: 'Reach affinity 30 with Lily',
    icon: '🩺',
    difficulty: 'Normal',
    relatedNPCId: 'lily',
    relatedLocationId: 'medical-center',
    completionCriteria: 'This task is completed automatically when Lily reaches affinity 30.',
    rewards: {
      description: 'Lily affinity milestone'
    }
  },

  'reach-affinity-mark': {
    id: 'reach-affinity-mark',
    title: 'Build Trust with Mark',
    description: 'Reach affinity 30 with Mark',
    icon: '🏦',
    difficulty: 'Normal',
    relatedNPCId: 'mark',
    relatedLocationId: 'main-bank',
    completionCriteria: 'This task is completed automatically when Mark reaches affinity 30.',
    rewards: {
      description: 'Mark affinity milestone'
    }
  },

  'reach-affinity-michael': {
    id: 'reach-affinity-michael',
    title: 'Build Trust with Michael',
    description: 'Reach affinity 30 with Michael',
    icon: '🛒',
    difficulty: 'Normal',
    relatedNPCId: 'michael',
    relatedLocationId: 'main-supermarket',
    completionCriteria: 'This task is completed automatically when Michael reaches affinity 30.',
    rewards: {
      description: 'Michael affinity milestone'
    }
  },

  'reach-affinity-cecilia': {
    id: 'reach-affinity-cecilia',
    title: 'Build Trust with Cecilia',
    description: 'Reach affinity 30 with Cecilia',
    icon: '🏠',
    difficulty: 'Normal',
    relatedNPCId: 'cecilia',
    relatedLocationId: 'main-apartment',
    completionCriteria: 'This task is completed automatically when Cecilia reaches affinity 30.',
    rewards: {
      description: 'Cecilia affinity milestone'
    }
  },
};

// 初始活跃任务列表
export const InitialActiveTasks = ['buy-coffee'];
