/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { HomeScreen } from './src/screens/HomeScreen';
import { NewSessionScreen } from './src/screens/NewSessionScreen';
import { RecordHandScreen } from './src/screens/RecordHandScreen';
import { EditHandScreen } from './src/screens/EditHandScreen';
import { HandDetailScreen } from './src/screens/HandDetailScreen';
import { EditSessionScreen } from './src/screens/EditSessionScreen';
import { StatsScreen } from './src/screens/StatsScreen';
import { PokerKeyboardScreen } from './src/screens/PokerKeyboardScreen';
import { AIAnalysisScreen } from './src/screens/AIAnalysisScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { SubscriptionScreen } from './src/screens/SubscriptionScreen';
import revenueCatService from './src/services/RevenueCatService';
import adMobService from './src/services/AdMobService';
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

function SettingsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="SettingsMain" component={SettingsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Subscription" component={SubscriptionScreen} options={{ title: 'Premium Subscription' }} />
    </Stack.Navigator>
  );
}

  export default function App() {
    useEffect(() => {
      // 初始化服務
      const initializeServices = async () => {
        try {
          // 初始化 RevenueCat
          await revenueCatService.initialize();
          
          // 初始化 AdMob（使用更安全的方式）
          await adMobService.initialize();
          
          console.log('✅ Services initialized successfully');
        } catch (error) {
          console.error('❌ Failed to initialize services:', error);
        }
      };

      initializeServices();
    }, []);

  return (
    <NavigationContainer>
      <Tab.Navigator screenOptions={{ headerShown: false }}>
        <Tab.Screen 
          name="Home" 
          component={HomeStack}
          listeners={({ navigation }) => ({
            tabPress: (e) => {
              // 當點擊Home tab時，重置導航堆疊到根頁面
              e.preventDefault();
              navigation.reset({
                index: 0,
                routes: [{ name: 'Home' }],
              });
            },
          })}
        />
        <Tab.Screen name="Stats" component={StatsScreen} />
        <Tab.Screen name="Settings" component={SettingsStack} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
