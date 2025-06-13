import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SessionForm } from '../components/SessionForm';
import { Button } from '../components/Button';
import { theme } from '../theme';
import { useSessionStore } from '../viewmodels/sessionStore';
import { Session } from '../models';

export const EditSessionScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  console.log('EditSessionScreen route params:', route.params);
  const { sessionId } = route.params || {};
  console.log('EditSessionScreen sessionId:', sessionId);
  
  if (!sessionId) {
    console.error('No sessionId provided to EditSessionScreen');
  }
  
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  
  const { updateSession, getSession, fetchSessions, fetchStats } = useSessionStore();

  useEffect(() => {
    loadSession();
  }, [sessionId]);

  const loadSession = async () => {
    try {
      console.log('Loading session with ID:', sessionId);
      const sessionData = await getSession(sessionId);
      console.log('Loaded session data:', sessionData);
      
      if (!sessionData) {
        throw new Error('Session not found');
      }
      
      setSession(sessionData);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load session:', error);
      console.error('Error details:', error instanceof Error ? error.message : String(error));
      setLoading(false);
    }
  };

  const handleSubmit = async (updatedSession: Session) => {
    await updateSession(updatedSession);
    await fetchSessions();
    await fetchStats();
    navigation.goBack();
  };

  if (!sessionId) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.loadingText}>Error: No session ID provided</Text>
        <Button title="Go Back" onPress={() => navigation.goBack()} />
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.loadingText}>Loading session data...</Text>
        <Text style={styles.loadingText}>Session ID: {sessionId}</Text>
      </View>
    );
  }

  if (!session) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.loadingText}>Session not found</Text>
        <Button title="Go Back" onPress={() => navigation.goBack()} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SessionForm
        initialSession={session}
        onSubmit={handleSubmit}
        submitButtonTitle="Update Session"
        isLoading={loading}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    fontSize: theme.font.size.body,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
}); 