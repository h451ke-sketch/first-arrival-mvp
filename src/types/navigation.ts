// src/types/navigation.ts

import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

// Define all screens and their parameters
export type RootStackParamList = {
  Map: undefined;
  CollegeMap: undefined;
  Dialogue: {
    locationId: string;
    npcId: string;
  };
  Summary: {
    conversationId: string;
  };
  Contacts: undefined;
  Tasks: undefined;
  Settings: undefined;
  Help: undefined;
  ConversationHistory: {
    npcId: string;
  };
};

// Navigation prop types for each screen
export type MapScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Map'>;
export type CollegeMapScreenNavigationProp = StackNavigationProp<RootStackParamList, 'CollegeMap'>;

export type DialogueScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Dialogue'>;
export type DialogueScreenRouteProp = RouteProp<RootStackParamList, 'Dialogue'>;

export type SummaryScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Summary'>;
export type SummaryScreenRouteProp = RouteProp<RootStackParamList, 'Summary'>;

export type ContactsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Contacts'>;

export type TasksScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Tasks'>;

export type SettingsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Settings'>;

export type HelpScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Help'>;

export type ConversationHistoryScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ConversationHistory'>;
export type ConversationHistoryScreenRouteProp = RouteProp<RootStackParamList, 'ConversationHistory'>;

// Declare global navigation types for TypeScript
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
