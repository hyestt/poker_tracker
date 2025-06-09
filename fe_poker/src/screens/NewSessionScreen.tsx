import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { CustomPicker } from '../components/CustomPicker';
import { CustomDateTimePicker } from '../components/DateTimePicker';
import { ColorTagPicker } from '../components/ColorTagPicker';

import { theme } from '../theme';
import { useSessionStore } from '../viewmodels/sessionStore';
import { Session } from '../models';
import { UserPreferencesService, UserPreferences } from '../services/UserPreferences';

export const NewSessionScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [blinds, setBlinds] = useState('');
  const [currency, setCurrency] = useState('');
  const [effectiveStack, setEffectiveStack] = useState('');
  const [tableSize, setTableSize] = useState('');
  const [tag, setTag] = useState('');

  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const { addSession, fetchHands, fetchStats } = useSessionStore();

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    const prefs = await UserPreferencesService.getPreferences();
    setPreferences(prefs);
    
    // Set default values from last choices or defaults
    setLocation(prefs.lastLocation || '');
    setCurrency(prefs.lastCurrency || '🇺🇸 USD');
    setTableSize(prefs.lastTableSize || '6');
    setBlinds(prefs.lastBlinds || '1/2');
    setEffectiveStack('100'); // Set default value to 100
    
    // Set current date and time as default
    const now = new Date();
    const formattedDate = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setDate(formattedDate);
  };

  const handleNext = async () => {
    // Parse blinds (format: "1/2" -> smallBlind: 1, bigBlind: 2)
    const [smallBlindStr, bigBlindStr] = blinds.split('/');
    const smallBlindValue = parseFloat(smallBlindStr) || 0;
    const bigBlindValue = parseFloat(bigBlindStr) || 0;

    const session: Session = {
      id: Date.now().toString(),
      location,
      date,
      smallBlind: smallBlindValue,
      bigBlind: bigBlindValue,
      currency,
      effectiveStack: parseInt(effectiveStack) || 0,
      tableSize: parseInt(tableSize) || 6,
      tag,
    };

    // Save current choices as user preferences
    await UserPreferencesService.updateLastChoices({
      location,
      currency,
      tableSize,
      blinds,
    });

    await addSession(session);
    await fetchHands();
    await fetchStats();
    navigation.navigate('RecordHand', { sessionId: session.id });
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

  if (!preferences) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
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

      <Card style={styles.section}>
        <ColorTagPicker
          title="Session Tag"
          value={tag}
          onValueChange={setTag}
        />
      </Card>

      <View style={styles.buttonContainer}>
        <Button title="Start Recording Hands" onPress={handleNext} />
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
  },
  section: {
    marginBottom: theme.spacing.xs,
    padding: theme.spacing.sm,
  },
  horizontalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldTitle: {
    fontSize: theme.font.size.body,
    fontWeight: '600',
    color: theme.colors.text,
    flex: 0.3,
  },
  inputContainer: {
    flex: 0.65,
  },
  helperText: {
    fontSize: theme.font.size.small,
    color: theme.colors.gray,
    marginTop: theme.spacing.xs,
    fontStyle: 'italic',
  },
  buttonContainer: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
}); 