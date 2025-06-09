import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { CustomPicker } from '../components/CustomPicker';
import { CustomDateTimePicker } from '../components/DateTimePicker';
import { theme } from '../theme';
import { useSessionStore } from '../viewmodels/sessionStore';
import { Session } from '../models';
import { UserPreferencesService, UserPreferences } from '../services/UserPreferences';

export const EditSessionScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  console.log('EditSessionScreen route params:', route.params);
  const { sessionId } = route.params || {};
  console.log('EditSessionScreen sessionId:', sessionId);
  
  if (!sessionId) {
    console.error('No sessionId provided to EditSessionScreen');
  }
  
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [blinds, setBlinds] = useState('');
  const [currency, setCurrency] = useState('');
  const [effectiveStack, setEffectiveStack] = useState('');
  const [tableSize, setTableSize] = useState('');
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  
  const { updateSession, getSession, fetchSessions, fetchStats } = useSessionStore();

  useEffect(() => {
    loadPreferencesAndSession();
  }, [sessionId]);

  const loadPreferencesAndSession = async () => {
    try {
      // Load user preferences first
      console.log('Loading preferences...');
      const prefs = await UserPreferencesService.getPreferences();
      console.log('Preferences loaded:', prefs);
      setPreferences(prefs);
      
      // Load session data
      console.log('Loading session with ID:', sessionId);
      const session = await getSession(sessionId);
      console.log('Loaded session data:', session);
      
      if (!session) {
        throw new Error('Session not found');
      }
      
      setLocation(session.location || '');
      setDate(session.date || '');
      setCurrency(session.currency || '');
      setEffectiveStack(session.effectiveStack?.toString() || '');
      setTableSize(session.tableSize?.toString() || '');
      
      // Format blinds as "smallBlind/bigBlind"
      setBlinds(`${session.smallBlind || 0}/${session.bigBlind || 0}`);
      
      setLoading(false);
    } catch (error) {
      console.error('Failed to load session:', error);
      console.error('Error details:', error instanceof Error ? error.message : String(error));
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Parse blinds (format: "1/2" -> smallBlind: 1, bigBlind: 2)
    const [smallBlindStr, bigBlindStr] = blinds.split('/');
    const smallBlindValue = parseFloat(smallBlindStr) || 0;
    const bigBlindValue = parseFloat(bigBlindStr) || 0;

    const session: Session = {
      id: sessionId,
      location,
      date,
      smallBlind: smallBlindValue,
      bigBlind: bigBlindValue,
      currency,
      effectiveStack: parseInt(effectiveStack) || 0,
      tableSize: parseInt(tableSize) || 6,
    };

    // Save current choices as user preferences
    await UserPreferencesService.updateLastChoices({
      location,
      currency,
      tableSize,
      blinds,
    });

    await updateSession(session);
    await fetchSessions();
    await fetchStats();
    navigation.goBack();
  };

  const updateLocationOptions = async (newOptions: string[]) => {
    if (preferences) {
      const updated = { ...preferences, customLocations: newOptions };
      setPreferences(updated);
      await UserPreferencesService.savePreferences(updated);
    }
  };

  const updateCurrencyOptions = async (newOptions: string[]) => {
    if (preferences) {
      const updated = { ...preferences, customCurrencies: newOptions };
      setPreferences(updated);
      await UserPreferencesService.savePreferences(updated);
    }
  };

  const updateTableSizeOptions = async (newOptions: string[]) => {
    if (preferences) {
      const updated = { ...preferences, customTableSizes: newOptions };
      setPreferences(updated);
      await UserPreferencesService.savePreferences(updated);
    }
  };

  const updateBlindsOptions = async (newOptions: string[]) => {
    if (preferences) {
      const updated = { ...preferences, customBlinds: newOptions };
      setPreferences(updated);
      await UserPreferencesService.savePreferences(updated);
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

  if (!preferences) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading preferences...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.section}>
        <CustomPicker
          title="Location"
          options={preferences.customLocations}
          value={location}
          onValueChange={setLocation}
          onOptionsChange={updateLocationOptions}
          placeholder="Select location"
        />
      </Card>

      <Card style={styles.section}>
        <CustomDateTimePicker
          title="Date & Time"
          value={date}
          onValueChange={setDate}
        />
      </Card>

      <Card style={styles.section}>
        <CustomPicker
          title="Blinds"
          options={preferences.customBlinds}
          value={blinds}
          onValueChange={setBlinds}
          onOptionsChange={updateBlindsOptions}
          placeholder="Select blinds (e.g. 1/2)"
        />
      </Card>

      <Card style={styles.section}>
        <CustomPicker
          title="Currency"
          options={preferences.customCurrencies}
          value={currency}
          onValueChange={setCurrency}
          onOptionsChange={updateCurrencyOptions}
          placeholder="Select currency"
        />
      </Card>

      <Card style={styles.section}>
        <CustomPicker
          title="Table Size"
          options={preferences.customTableSizes.map(size => `${size} Players`)}
          value={tableSize ? `${tableSize} Players` : ''}
          onValueChange={(value) => {
            const sizeOnly = value.replace(' Players', '');
            setTableSize(sizeOnly);
          }}
          onOptionsChange={(newOptions) => {
            const sizesOnly = newOptions.map(option => option.replace(' Players', ''));
            updateTableSizeOptions(sizesOnly);
          }}
          placeholder="Select table size"
        />
      </Card>

      <Card style={styles.section}>
        <View style={styles.horizontalContainer}>
          <Text style={styles.fieldTitle}>Effective Stack</Text>
          <View style={styles.inputContainer}>
            <Input 
              value={effectiveStack} 
              onChangeText={setEffectiveStack} 
              placeholder="Starting stack amount" 
              keyboardType="numeric" 
            />
          </View>
        </View>
      </Card>

      <View style={styles.buttonContainer}>
        <Button title="Update Session" onPress={handleSave} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    fontSize: theme.font.size.body,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  section: {
    marginBottom: theme.spacing.sm,
  },
  horizontalContainer: {
    marginBottom: theme.spacing.sm,
  },
  fieldTitle: {
    fontSize: theme.font.size.body,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  inputContainer: {
    flex: 1,
  },
  buttonContainer: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
}); 