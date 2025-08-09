/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, LogBox } from 'react-native';

// 隱藏新架構警告以改善用戶體驗
LogBox.ignoreLogs([
  'The app is running using the Legacy',
  'New Architecture',
]);
import { NavigationContainer } from '@react-navigation/native';
import { theme } from './src/theme';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
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
import { SessionsScreen } from './src/screens/SessionsScreen';
import { SessionDetailScreen } from './src/screens/SessionDetailScreen';
import RevenueCatService from './src/services/RevenueCatService';
import { useSessionStore } from './src/viewmodels/sessionStore';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function HomeStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#2D3748',
        },
        headerTintColor: '#F7FAFC',
        headerTitleStyle: {
          color: '#F7FAFC',
        },
        transitionSpec: {
          open: {
            animation: 'timing',
            config: {
              duration: 250,
            },
          },
          close: {
            animation: 'timing',
            config: {
              duration: 250,
            },
          },
        },
        cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="HandDetail" component={HandDetailScreen} options={{ title: 'Hand Details', headerBackTitle: 'Back' }} />
      <Stack.Screen name="NewSession" component={NewSessionScreen} options={{ title: 'New Session', headerBackTitle: 'Back' }} />
      <Stack.Screen name="RecordHand" component={RecordHandScreen} options={{ title: 'Record Hand', headerBackTitle: 'Back' }} />
      <Stack.Screen name="EditHand" component={EditHandScreen} options={{ title: 'Edit Hand' }} />
      <Stack.Screen name="EditSession" component={EditSessionScreen} options={{ title: 'Edit Session' }} />
      <Stack.Screen name="PokerKeyboard" component={PokerKeyboardScreen} options={{ title: 'Choose Cards' }} />
      <Stack.Screen name="AIAnalysis" component={AIAnalysisScreen} options={{ title: 'GTO Analysis' }} />
    </Stack.Navigator>
  );
}

const SessionsStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: true,
      headerStyle: {
        backgroundColor: '#2D3748',
      },
      headerTintColor: '#F7FAFC',
      headerTitleStyle: {
        color: '#F7FAFC',
      },
      transitionSpec: {
        open: {
          animation: 'timing',
          config: {
            duration: 250,
          },
        },
        close: {
          animation: 'timing',
          config: {
            duration: 250,
          },
        },
      },
      cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
    }}
  >
    <Stack.Screen name="SessionsList" component={SessionsScreen} options={{ headerShown: false }} />
    <Stack.Screen name="NewSession" component={NewSessionScreen} options={{ title: 'New Session', headerBackTitle: 'Back' }} />
    <Stack.Screen name="SessionDetail" component={SessionDetailScreen} options={{ title: 'Session Details', headerBackTitle: 'Back' }} />
    <Stack.Screen name="EditSession" component={EditSessionScreen} options={{ title: 'Edit Session' }} />
    <Stack.Screen name="RecordHand" component={RecordHandScreen} options={{ title: 'Record Hand', headerBackTitle: 'Back' }} />
    <Stack.Screen name="EditHand" component={EditHandScreen} options={{ title: 'Edit Hand' }} />
    <Stack.Screen name="HandDetail" component={HandDetailScreen} options={{ title: 'Hand Details', headerBackTitle: 'Back' }} />
    <Stack.Screen name="AIAnalysis" component={AIAnalysisScreen} options={{ title: 'GTO Analysis' }} />
    <Stack.Screen
      name="PokerKeyboard"
      component={PokerKeyboardScreen}
      options={{
        title: 'Choose Cards',
        presentation: 'modal',
        headerStyle: { backgroundColor: theme.colors.background },
        headerTitleStyle: { color: theme.colors.text },
        headerTintColor: theme.colors.primary,
      }}
    />
  </Stack.Navigator>
);

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
        // 添加延遲確保原生模塊完全初始化
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 順序初始化而不是並行，避免時序問題
        await initializeSessionStore();
        await RevenueCatService.initialize();

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
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#2D3748',
            borderTopColor: '#4A5568',
          },
          tabBarActiveTintColor: '#5B8DEE',
          tabBarInactiveTintColor: '#718096',
        }}
      >
        <Tab.Screen name="Sessions" component={SessionsStack} />
        <Tab.Screen
          name="Hands"
          component={HomeStack}
        />
        <Tab.Screen name="Settings" component={SettingsStack} />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1F2937',
  },
});

export default App;
