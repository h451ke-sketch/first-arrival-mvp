// src/types/npc.ts

export interface NPC {
  id: string;
  name: string;
  role: string;
  location: string;
  avatar: any;
  video?: any; // optional looping muted video, replaces avatar in DialogueScreen when present
  voiceModel: string; // Deepgram TTS 语音模型 ID
  personality: {
    traits: string[];
    speechStyle: string;
    culturalBackground: string;
  };
  defaultAffinity: number;
}

export interface NPCAffinity {
  npcId: string;
  currentAffinity: number;
  conversationCount: number;
  lastInteraction: Date;
  relationshipLevel: 'stranger' | 'acquaintance' | 'friend' | 'close-friend';
}
