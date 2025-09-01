/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, LogBox } from 'react-native';

// 臨時移除警告過濾以檢查連線問題
// LogBox.ignoreLogs([
//   'The app is running using the Legacy',
//   'New Architecture',
//   'Cannot connect to Metro',
//   'Metro',
//   'Remote debugger',
//   'Warning:',
//   'ReactNativeFiberHostComponent',
//   'VirtualizedLists should never be nested',
//   'Require cycle:',
//   'source.uri should not be an empty string',
//   'componentWillReceiveProps',
//   'componentWillMount',
//   'componentWillUpdate',
//   'Failed to print',
//   'RevenueCat',
//   'Flipper',
// ]);

// 在生產環境下完全關閉所有 console 輸出
if (!__DEV__) {
  console.log = () => {};
  console.warn = () => {};
  console.error = () => {};
  console.info = () => {};
  console.debug = () => {};
}
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

// Import test utility in development - temporarily disabled to prevent crash
// if (__DEV__) {
//   require('./src/utils/testPremiumModel');
// }
import { SessionsScreen } from './src/screens/SessionsScreen';
import { SessionDetailScreen } from './src/screens/SessionDetailScreen';
import RevenueCatService from './src/services/RevenueCatService';
import { useSessionStore } from './src/viewmodels/sessionStore';

const RootStack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Main Tab Navigator
function MainTabs() {
  return (
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
      <Tab.Screen name="Sessions" component={SessionsScreen} />
      <Tab.Screen name="Hands" component={HomeScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

const App = () => {
  const { initialize: initializeSessionStore } = useSessionStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 初始化應用服務
    const initializeServices = async () => {
      try {
        console.log('Starting app initialization...');

        // 先初始化 session store
        console.log('Initializing session store...');
        await initializeSessionStore();
        console.log('Session store initialized');

        // 然後初始化 RevenueCat（如果失敗不影響app運行）
        try {
          console.log('Initializing RevenueCat...');
          await RevenueCatService.initialize();
          console.log('RevenueCat initialized');
          // 在開發模式下，啟用無限次 AI 分析（模擬 Premium 並重置配額）
          if (__DEV__) {
            await RevenueCatService.setTestPremiumStatus(true);
            await RevenueCatService.resetGTOQuotaForTesting();
          }
        } catch (rcError) {
          console.warn('RevenueCat initialization failed, continuing without premium features:', rcError);
        }

        console.log('Services initialized successfully');
      } catch (error) {
        console.error('Critical initialization failure:', error);
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
      <RootStack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
          gestureDirection: 'horizontal',
        }}
      >
        <RootStack.Screen name="MainTabs" component={MainTabs} />
        
        {/* Detail screens without tab bar */}
        <RootStack.Screen 
          name="SessionDetail" 
          component={SessionDetailScreen as any} 
          options={{ 
            headerShown: true,
            title: 'Sessions',
            headerStyle: { backgroundColor: '#2D3748' },
            headerTintColor: '#F7FAFC',
            headerBackTitle: 'Back',
          }} 
        />
        <RootStack.Screen 
          name="NewSession" 
          component={NewSessionScreen} 
          options={{ 
            headerShown: true,
            title: 'New Session',
            headerStyle: { backgroundColor: '#2D3748' },
            headerTintColor: '#F7FAFC',
            headerBackTitle: 'Back',
          }} 
        />
        <RootStack.Screen 
          name="EditSession" 
          component={EditSessionScreen} 
          options={{ 
            headerShown: true,
            title: 'Edit Session',
            headerStyle: { backgroundColor: '#2D3748' },
            headerTintColor: '#F7FAFC',
            headerBackTitle: 'Back',
          }} 
        />
        <RootStack.Screen 
          name="RecordHand" 
          component={RecordHandScreen} 
          options={{ 
            headerShown: true,
            title: 'Record Hand',
            headerStyle: { backgroundColor: '#2D3748' },
            headerTintColor: '#F7FAFC',
            headerBackTitle: 'Back',
          }} 
        />
        <RootStack.Screen 
          name="EditHand" 
          component={EditHandScreen} 
          options={{ 
            headerShown: true,
            title: 'Edit Hand',
            headerStyle: { backgroundColor: '#2D3748' },
            headerTintColor: '#F7FAFC',
            headerBackTitle: 'Back',
          }} 
        />
        <RootStack.Screen 
          name="HandDetail" 
          component={HandDetailScreen} 
          options={{ 
            headerShown: true,
            title: 'Hand Details',
            headerStyle: { backgroundColor: '#2D3748' },
            headerTintColor: '#F7FAFC',
            headerBackTitle: 'Back',
          }} 
        />
        <RootStack.Screen 
          name="AIAnalysis" 
          component={AIAnalysisScreen} 
          options={{ 
            headerShown: true,
            title: 'AI Solver',
            headerStyle: { backgroundColor: '#2D3748' },
            headerTintColor: '#F7FAFC',
            headerBackTitle: 'Back',
          }} 
        />
        <RootStack.Screen 
          name="PokerKeyboard" 
          component={PokerKeyboardScreen} 
          options={{ 
            headerShown: true,
            title: 'Choose Cards',
            presentation: 'modal',
            headerStyle: { backgroundColor: theme.colors.background },
            headerTitleStyle: { color: theme.colors.text },
            headerTintColor: theme.colors.primary,
          }} 
        />
        <RootStack.Screen 
          name="Subscription" 
          component={SubscriptionScreen} 
          options={{ 
            headerShown: true,
            title: 'Subscription',
            headerStyle: { backgroundColor: '#2D3748' },
            headerTintColor: '#F7FAFC',
            headerBackTitle: 'Back',
          }} 
        />
      </RootStack.Navigator>
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
