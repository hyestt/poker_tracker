import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { SessionForm } from '../components/SessionForm';
import { theme } from '../theme';
import { useSessionStore } from '../viewmodels/sessionStore';
import { Session } from '../models';

export const NewSessionScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { addSession, fetchHands, fetchStats } = useSessionStore();

  const handleSubmit = async (session: Session) => {
    try {
      await addSession(session);
      await fetchHands();
      await fetchStats();
      navigation.navigate('RecordHand', { sessionId: session.id });
    } catch (error) {
      console.error('Failed to create session:', error);
      Alert.alert('Error', 'Failed to create session');
    }
  };

  return (
    <View style={styles.container}>
      <SessionForm
        onSubmit={handleSubmit}
        submitButtonTitle="Start Recording Hands"
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