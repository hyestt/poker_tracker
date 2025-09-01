import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
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
  const [loading, setLoading] = useState(false);

  const { updateSession, sessions, fetchSessions, fetchStats } = useSessionStore();

  useEffect(() => {
    // 首先嘗試從 store 中找到 session，避免重複的資料庫查詢
    const existingSession = sessions.find(s => s.id === sessionId);
    if (existingSession) {
      console.log('Found session in store, using cached data');
      setSession(existingSession);
      setLoading(false);
    } else {
      console.log('Session not found in store, loading from database');
      loadSession();
    }
  }, [sessionId, sessions]);

  const loadSession = async () => {
    try {
      setLoading(true);
      console.log('Loading session with ID:', sessionId);
      const sessionData = await useSessionStore.getState().getSession(sessionId);
      console.log('Loaded session data:', sessionData);

      if (!sessionData) {
        throw new Error('Session not found');
      }

      setSession(sessionData);
    } catch (error) {
      console.error('Failed to load session:', error);
      console.error('Error details:', error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (updatedSession: Session) => {
    try {
      await updateSession(updatedSession);
      await fetchSessions();
      await fetchStats();
      navigation.goBack();
    } catch (error) {
      console.error('Failed to update session:', error);
      Alert.alert('Error', 'Failed to update session');
    }
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
