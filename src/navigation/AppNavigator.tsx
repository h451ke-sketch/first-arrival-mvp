// src/navigation/AppNavigator.tsx

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import MapScreen from '../screens/MapScreen';
import CollegeMapScreen from '../screens/CollegeMapScreen';
import DialogueScreen from '../screens/DialogueScreen';
import SummaryScreen from '../screens/SummaryScreen';
import ContactsScreen from '../screens/ContactsScreen';
import TasksScreen from '../screens/TasksScreen';
import SettingsScreen from '../screens/SettingsScreen';
import HelpScreen from '../screens/HelpScreen';
import ConversationHistoryScreen from '../screens/ConversationHistoryScreen';
import { RootStackParamList } from '../types/navigation';

const Stack = createStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Map"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Map" component={MapScreen} />
        <Stack.Screen name="CollegeMap" component={CollegeMapScreen} />
        <Stack.Screen name="Dialogue" component={DialogueScreen} />
        <Stack.Screen name="Summary" component={SummaryScreen} />
        <Stack.Screen name="Contacts" component={ContactsScreen} options={{ presentation: 'transparentModal' }} />
        <Stack.Screen name="Tasks" component={TasksScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ presentation: 'transparentModal' }} />
        <Stack.Screen name="Help" component={HelpScreen} />
        <Stack.Screen name="ConversationHistory" component={ConversationHistoryScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
