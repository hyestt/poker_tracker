import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { SessionForm } from '../components/SessionForm';
import { theme } from '../theme';
import { useSessionStore } from '../viewmodels/sessionStore';
import { Session } from '../models';

export const NewSessionScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  console.log('➕ [NewSessionScreen] Component mounted');
  const { addSession, fetchHands, fetchStats } = useSessionStore();
  const [isLoading, setIsLoading] = useState(false);

  // 隱藏底部 TabBar，離開時恢復
  useEffect(() => {
    const parent = navigation?.getParent?.();
    if (!parent) {return;}
    const defaultTabBarStyle = { backgroundColor: '#2D3748', borderTopColor: '#4A5568' } as const;
    parent.setOptions({ tabBarStyle: { display: 'none' } });
    return () => {
      parent.setOptions({ tabBarStyle: defaultTabBarStyle });
    };
  }, [navigation]);

  const handleSubmit = async (session: Session) => {
    console.log('📝 [NewSessionScreen] Session form submitted:', {
      id: session.id,
      location: session.location,
      smallBlind: session.smallBlind,
      bigBlind: session.bigBlind,
      date: session.date,
    });

    if (isLoading) {
      console.warn('⚠️ [NewSessionScreen] Submit blocked - already loading');
      return; // 防止重複提交
    }

    console.log('🔄 [NewSessionScreen] Starting session creation process');
    setIsLoading(true);

    try {
      console.log('💾 [NewSessionScreen] Adding session to store/database');
      await addSession(session);

      console.log('📊 [NewSessionScreen] Refreshing hands data');
      await fetchHands();

      console.log('📊 [NewSessionScreen] Refreshing stats data');
      await fetchStats();

      console.log('🎯 [NewSessionScreen] Navigating to RecordHand screen with sessionId:', session.id);
      navigation.navigate('RecordHand', { sessionId: session.id });

      console.log('✅ [NewSessionScreen] Session creation completed successfully');
    } catch (error) {
      console.error('❌ [NewSessionScreen] Session creation failed:', error);
      Alert.alert('Error', 'Failed to create session');
    } finally {
      console.log('🔄 [NewSessionScreen] Session creation process ended, setting loading to false');
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <SessionForm
        onSubmit={handleSubmit}
        submitButtonTitle="Start Recording Hands"
        isLoading={isLoading}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
});
