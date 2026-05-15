// src/data/locations.ts

import { Location } from '../types/game';

export const MainMapLocations: Record<string, Location> = {
  'main-school': {
    id: 'main-school',
    name: 'School',
    displayName: { en: 'School', zh: '学校' },
    image: require('../../assets/locations/main_school.png'),
    npcId: 'jack', // 占位，点击后跳转至学校副地图
    position: { x: 173, y: 150 },
    unlocked: true
  },

  'main-supermarket': {
    id: 'main-supermarket',
    name: 'Supermarket',
    displayName: { en: 'Supermarket', zh: '超市' },
    image: require('../../assets/locations/main_supermarket.png'),
    npcId: 'michael',
    position: { x: 270, y: 150 },
    unlocked: false
  },

  'main-apartment': {
    id: 'main-apartment',
    name: 'Apartment',
    displayName: { en: 'Apartment', zh: '公寓' },
    image: require('../../assets/locations/main_apartment.png'),
    npcId: 'cecilia',
    position: { x: 190, y: 265 },
    unlocked: false
  },

  'main-bank': {
    id: 'main-bank',
    name: 'Bank',
    displayName: { en: 'Bank', zh: '银行' },
    image: require('../../assets/locations/main_bank.png'),
    npcId: 'mark',
    position: { x: 325, y:205 },
    unlocked: false
  }
};

export const CollegeLocations: Record<string, Location> = {
  'student-center': {
    id: 'student-center',
    name: 'Student Center',
    displayName: { en: 'Student Center', zh: '学生中心' },
    image: require('../../assets/locations/student-center.png'),
    npcId: 'mia',
    position: { x: 170, y: 100 },
    unlocked: false
  },

  'counseling-room': {
    id: 'counseling-room',
    name: 'Counseling Room',
    displayName: { en: 'Counseling Room', zh: '心理咨询室' },
    image: require('../../assets/locations/counseling.png'),
    npcId: 'mindy',
    position: { x: 235, y: 80 },
    unlocked: false
  },

  'medical-center': {
    id: 'medical-center',
    name: 'Medical Centre',
    displayName: { en: 'Medical Centre', zh: '急救中心' },
    image: require('../../assets/locations/medical.png'),
    npcId: 'lily',
    position: { x: 330, y: 168 },
    unlocked: false
  },

  'college-classroom': {
    id: 'college-classroom',
    name: 'Classroom',
    displayName: { en: 'Classroom', zh: '教室' },
    image: require('../../assets/locations/classroom.png'),
    npcId: 'ethan',
    position: { x: 140, y: 190 },
    unlocked: false
  },

  'college-cafe': {
    id: 'college-cafe',
    name: 'Campus Cafe',
    displayName: { en: 'Campus Cafe', zh: '校园咖啡馆' },
    image: require('../../assets/locations/cafe.png'),
    npcId: 'jack',
    position: { x: 230, y: 240 },
    unlocked: true
  }
};

// 合并导出，DialogueScreen 等处通过 Locations[id] 访问
export const Locations: Record<string, Location> = {
  ...MainMapLocations,
  ...CollegeLocations
};
