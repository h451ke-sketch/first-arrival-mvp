// src/data/npcs.ts

import { NPC } from '../types/npc';

export const NPCs: Record<string, NPC> = {
  // 1. 咖啡店员
  jack: {
    id: 'jack',
    name: 'Jack',
    role: 'Barista',
    location: 'college-cafe',
    avatar: require('../../assets/npcs/jack.jpg'),
    video: require('../../assets/npcs/jack.mp4'),
    voiceModel: 'aura-arcas-en', // 阳光男声
    personality: {
      traits: ['friendly', 'casual', 'energetic'],
      speechStyle: 'Uses Australian slang, very welcoming, casual and warm',
      culturalBackground: 'Born and raised in Sydney, loves coffee culture'
    },
    defaultAffinity: 0
  },

  // 2. 学生中心老师
  mia: {
    id: 'mia',
    name: 'Mia',
    role: 'Student Center Staff',
    location: 'student-center',
    avatar: require('../../assets/npcs/mia.jpg'),
    video: require('../../assets/npcs/mia.mp4'),
    voiceModel: 'aura-luna-en', // 温柔专业女声
    personality: {
      traits: ['organized', 'helpful', 'patient'],
      speechStyle: 'Speaks softly, clear pronunciation, very patient',
      culturalBackground: 'Melbourne local, education background'
    },
    defaultAffinity: 0
  },

  // 3. 学校 Tutor
  ethan: {
    id: 'ethan',
    name: 'Ethan',
    role: 'Tutor',
    location: 'college-classroom',
    avatar: require('../../assets/npcs/ethan.jpg'),
    video: require('../../assets/npcs/ethan.mp4'),
    voiceModel: 'aura-orion-en', // 稳重学者男声
    personality: {
      traits: ['knowledgeable', 'strict but fair', 'helpful'],
      speechStyle: 'Academic but accessible, uses precise language',
      culturalBackground: 'Local academic, loves research'
    },
    defaultAffinity: 0
  },

  // 4. 银行柜员
  mark: {
    id: 'mark',
    name: 'Mark',
    role: 'Bank Teller',
    location: 'bank',
    avatar: require('../../assets/npcs/mark.jpg'),
    video: require('../../assets/npcs/mark.mp4'),
    voiceModel: 'aura-angus-en', // 澳洲口音男声
    personality: {
      traits: ['professional', 'patient', 'formal'],
      speechStyle: 'Clear, professional, but friendly',
      culturalBackground: 'Sydney local, banking professional'
    },
    defaultAffinity: 0
  },

  // 5. 学校医生
  lily: {
    id: 'lily',
    name: 'Lily',
    role: 'Doctor',
    location: 'medical-center',
    avatar: require('../../assets/npcs/lily.jpg'),
    video: require('../../assets/npcs/lily.mp4'), // TODO: add assets/npcs/lily.jpg
    voiceModel: 'aura-athena-en', // 专业温暖女声
    personality: {
      traits: ['professional', 'caring', 'thorough'],
      speechStyle: 'Clear and reassuring, explains things patiently, uses simple terms for medical topics',
      culturalBackground: 'Brisbane local, general practitioner passionate about international student health'
    },
    defaultAffinity: 0
  },

  // 6. 心理医生
  mindy: {
    id: 'mindy',
    name: 'Mindy',
    role: 'Counsellor',
    location: 'counseling-room',
    avatar: require('../../assets/npcs/mindy.jpg'),
    video: require('../../assets/npcs/mindy.mp4'), // TODO: add assets/npcs/mindy.jpg
    voiceModel: 'aura-stella-en', // 温柔舒缓女声
    personality: {
      traits: ['warm', 'patient', 'empathetic'],
      speechStyle: 'Gentle and slow-paced, uses reflective listening, never rushes or interrupts',
      culturalBackground: 'Melbourne local, specialises in international student wellbeing and adjustment'
    },
    defaultAffinity: 0
  },

  // 7. 超市店员
  michael: {
    id: 'michael',
    name: 'Michael',
    role: 'Supermarket Staff',
    location: 'main-supermarket',
    avatar: require('../../assets/npcs/michael.jpg'),
    video: require('../../assets/npcs/michael.mp4'), // TODO: add assets/npcs/michael.jpg
    voiceModel: 'aura-zeus-en', // 温和低调男声
    personality: {
      traits: ['shy', 'honest', 'helpful'],
      speechStyle: 'Speaks softly and a little hesitantly, uses simple words, occasionally awkward but genuinely trying to help',
      culturalBackground: 'Melbourne local, part-time student working at the supermarket to support his studies'
    },
    defaultAffinity: 0
  },

  // 8. 公寓前台
  cecilia: {
    id: 'cecilia',
    name: 'Cecilia',
    role: 'Apartment Receptionist',
    location: 'main-apartment',
    avatar: require('../../assets/npcs/cecilia.jpg'),
    video: require('../../assets/npcs/cecilia.mp4'), // TODO: add assets/npcs/cecilia.jpg
    voiceModel: 'aura-hera-en', // 冷静干练女声
    personality: {
      traits: ['calm', 'efficient', 'composed'],
      speechStyle: 'Measured and precise, minimal small talk, matter-of-fact but never rude',
      culturalBackground: 'Sydney local, experienced in property management, has handled every kind of tenant situation'
    },
    defaultAffinity: 0
  }
};
