// src/store/conversationStore.ts

import { create } from 'zustand';
import { Conversation, Message, ConversationSummary } from '../types/conversation';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ConversationState {
  currentConversation: Conversation | null;
  conversationHistory: Conversation[];

  // Actions
  startConversation: (npcId: string, location: string) => void;
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  updateAffinity: (change: number) => void;
  endConversation: (summary: ConversationSummary) => void;
  loadHistory: () => Promise<void>;
  saveHistory: () => Promise<void>;
  clearAllConversations: () => Promise<void>;
}

export const useConversationStore = create<ConversationState>((set, get) => ({
  currentConversation: null,
  conversationHistory: [],
  
  startConversation: (npcId, location) => {
    const conversation: Conversation = {
      id: Date.now().toString(),
      npcId,
      location,
      startedAt: new Date(),
      messages: [],
      initialAffinity: 0,
      finalAffinity: 0,
      affinityChange: 0
    };
    
    set({ currentConversation: conversation });
  },
  
  addMessage: (messageData) => {
    const current = get().currentConversation;
    if (!current) return;
    
    const message: Message = {
      ...messageData,
      id: Date.now().toString(),
      timestamp: new Date()
    };
    
    set({
      currentConversation: {
        ...current,
        messages: [...current.messages, message]
      }
    });
  },
  
  updateAffinity: (change) => {
    const current = get().currentConversation;
    if (!current) return;
    
    const newAffinity = Math.max(0, Math.min(100, current.finalAffinity + change));
    
    set({
      currentConversation: {
        ...current,
        finalAffinity: newAffinity,
        affinityChange: current.affinityChange + change
      }
    });
  },
  
  endConversation: (summary) => {
    const current = get().currentConversation;
    if (!current) return;
    
    const finished: Conversation = {
      ...current,
      endedAt: new Date(),
      summary
    };
    
    set({
      currentConversation: null,
      conversationHistory: [...get().conversationHistory, finished]
    });
    
    get().saveHistory();
  },
  
  loadHistory: async () => {
    try {
      const saved = await AsyncStorage.getItem('@conversation_history');
      if (saved) {
        const history = JSON.parse(saved);
        set({ conversationHistory: history });
      }
    } catch (error) {
      console.error('Failed to load conversation history:', error);
    }
  },
  
  saveHistory: async () => {
    try {
      const history = get().conversationHistory;
      await AsyncStorage.setItem('@conversation_history', JSON.stringify(history));
    } catch (error) {
      console.error('Failed to save conversation history:', error);
    }
  },

  clearAllConversations: async () => {
    try {
      // 清空对话历史
      set({
        currentConversation: null,
        conversationHistory: []
      });

      // 清除 AsyncStorage
      await AsyncStorage.removeItem('@conversation_history');

      console.log('[ConversationStore] All conversations cleared');
    } catch (error) {
      console.error('Failed to clear conversations:', error);
      throw error;
    }
  }
}));
