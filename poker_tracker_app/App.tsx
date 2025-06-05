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
import { HistoryScreen } from './src/screens/HistoryScreen';
import { StatsScreen } from './src/screens/StatsScreen';
import { View, Text } from 'react-native';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="NewSession" component={NewSessionScreen} options={{ title: '新場次' }} />
      <Stack.Screen name="RecordHand" component={RecordHandScreen} options={{ title: '紀錄手牌' }} />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator screenOptions={{ headerShown: false }}>
        <Tab.Screen name="首頁" component={HomeStack} />
        <Tab.Screen name="歷史" component={HistoryScreen} />
        <Tab.Screen name="統計" component={StatsScreen} />
        <Tab.Screen name="個人" component={() => <View style={{flex:1,justifyContent:'center',alignItems:'center'}}><Text>個人頁（可擴充）</Text></View>} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
