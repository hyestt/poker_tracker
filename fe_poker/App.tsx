/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { HomeScreen } from './src/screens/HomeScreen';
import { NewSessionScreen } from './src/screens/NewSessionScreen';
import { RecordHandScreen } from './src/screens/RecordHandScreen';
import { EditHandScreen } from './src/screens/EditHandScreen';
import { HandDetailScreen } from './src/screens/HandDetailScreen';
import { EditSessionScreen } from './src/screens/EditSessionScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { StatsScreen } from './src/screens/StatsScreen';
import { PokerKeyboardScreen } from './src/screens/PokerKeyboardScreen';
import { AIAnalysisScreen } from './src/screens/AIAnalysisScreen';
import { View, Text } from 'react-native';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="HandDetail" component={HandDetailScreen} options={{ title: 'Hand Details' }} />
      <Stack.Screen name="NewSession" component={NewSessionScreen} options={{ title: 'New Session' }} />
      <Stack.Screen name="RecordHand" component={RecordHandScreen} options={{ title: 'Record Hand' }} />
      <Stack.Screen name="EditHand" component={EditHandScreen} options={{ title: 'Edit Hand' }} />
      <Stack.Screen name="EditSession" component={EditSessionScreen} options={{ title: 'Edit Session' }} />
      <Stack.Screen name="PokerKeyboard" component={PokerKeyboardScreen} options={{ title: 'Choose Cards' }} />
      <Stack.Screen name="AIAnalysis" component={AIAnalysisScreen} options={{ title: 'AI Analysis' }} />
    </Stack.Navigator>
  );
}

function HistoryStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="HistoryMain" component={HistoryScreen} options={{ title: 'History' }} />
      <Stack.Screen name="HandDetail" component={HandDetailScreen} options={{ title: 'Hand Details' }} />
      <Stack.Screen name="EditHand" component={EditHandScreen} options={{ title: 'Edit Hand' }} />
      <Stack.Screen name="EditSession" component={EditSessionScreen} options={{ title: 'Edit Session' }} />
      <Stack.Screen name="AIAnalysis" component={AIAnalysisScreen} options={{ title: 'AI Analysis' }} />
    </Stack.Navigator>
  );
}

const ProfileScreen = () => (
  <View style={{flex:1,justifyContent:'center',alignItems:'center'}}>
    <Text>Profile (Coming Soon)</Text>
  </View>
);

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator screenOptions={{ headerShown: false }}>
        <Tab.Screen name="Home" component={HomeStack} />
        <Tab.Screen name="History" component={HistoryStack} />
        <Tab.Screen name="Stats" component={StatsScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
