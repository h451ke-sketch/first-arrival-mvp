// src/types/conversation.ts

export interface Message {
  id: string;
  role: 'user' | 'npc';
  content: string;
  audioTranscript?: string;
  timestamp: Date;
  affinityChange?: number;
  feedback?: LanguageFeedback;
}

export interface LanguageFeedback {
  hasError: boolean;
  errorType?: 'grammar' | 'vocabulary' | 'pronunciation' | 'politeness';
  suggestion?: string;
  correctedVersion?: string;
  explanation?: string;
}

export interface Conversation {
  id: string;
  npcId: string;
  location: string;
  startedAt: Date;
  endedAt?: Date;
  messages: Message[];
  initialAffinity: number;
  finalAffinity: number;
  affinityChange: number;
  summary?: ConversationSummary;
}

export interface ConversationSummary {
  overallFeedback: string;
  languageTips: string[];
  culturalTips: string[];
  strengths: string[];
  areasToImprove: string[];
}
