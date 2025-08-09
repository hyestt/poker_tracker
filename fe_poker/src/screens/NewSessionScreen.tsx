import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { SessionForm } from '../components/SessionForm';
import { theme } from '../theme';
import { useSessionStore } from '../viewmodels/sessionStore';
import { Session } from '../models';

export const NewSessionScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { addSession, fetchHands, fetchStats } = useSessionStore();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (session: Session) => {
    if (isLoading) {
      return; // 防止重複提交
    }

    setIsLoading(true);

    try {
      console.log('Creating session with ID:', session.id);
      await addSession(session);
      await fetchHands();
      await fetchStats();
      navigation.navigate('RecordHand', { sessionId: session.id });
    } catch (error) {
      console.error('Failed to create session:', error);
      Alert.alert('Error', 'Failed to create session');
    } finally {
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
