/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { HomeScreen } from './src/screens/HomeScreen';
import { NewSessionScreen } from './src/screens/NewSessionScreen';
import { RecordHandScreen } from './src/screens/RecordHandScreen';
import { EditHandScreen } from './src/screens/EditHandScreen';
import { HandDetailScreen } from './src/screens/HandDetailScreen';
import { EditSessionScreen } from './src/screens/EditSessionScreen';
import { PokerKeyboardScreen } from './src/screens/PokerKeyboardScreen';
import { AIAnalysisScreen } from './src/screens/AIAnalysisScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { SubscriptionScreen } from './src/screens/SubscriptionScreen';
import RevenueCatService from './src/services/RevenueCatService';
import { useSessionStore } from './src/viewmodels/sessionStore';

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

const SettingsStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="SettingsMain" component={SettingsScreen} />
    <Stack.Screen name="Subscription" component={SubscriptionScreen} />
  </Stack.Navigator>
);

const App = () => {
  const { initialize: initializeSessionStore } = useSessionStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 初始化應用服務
    const initializeServices = async () => {
      try {
        // 同時初始化所有必要的服務
        await Promise.all([
          initializeSessionStore(),
          RevenueCatService.initialize()
        ]);
        console.log('Services initialized successfully from App.tsx');
      } catch (error) {
        console.error('Failed to initialize services from App.tsx:', error);
        // 即使初始化失敗，也應繼續運行應用，讓用戶能看到UI
      } finally {
        // 無論成功或失敗，都結束載入狀態
        setIsLoading(false);
      }
    };

    initializeServices();
  }, [initializeSessionStore]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Tab.Navigator screenOptions={{ headerShown: false }}>
        <Tab.Screen 
          name="Home" 
          component={HomeStack}
          listeners={({ navigation }) => ({
            tabPress: (e) => {
              e.preventDefault();
              navigation.reset({
                index: 0,
                routes: [{ name: 'Home' }],
              });
            },
          })}
        />
        <Tab.Screen name="Settings" component={SettingsStack} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  }
});

export default App;
