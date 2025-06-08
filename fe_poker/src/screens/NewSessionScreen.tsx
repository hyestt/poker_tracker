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

export const NewSessionScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [blinds, setBlinds] = useState('');
  const [currency, setCurrency] = useState('');
  const [effectiveStack, setEffectiveStack] = useState('');
  const [tableSize, setTableSize] = useState('');
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
    setCurrency(prefs.lastCurrency || 'USD ($)');
    setTableSize(prefs.lastTableSize || '6');
    setBlinds(prefs.lastBlinds || '1/2');
    
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
        <Text style={styles.loadingText}>載入中...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>New Session Setup</Text>
      
      <Card style={styles.section}>
        <CustomPicker
          title="Location"
          options={preferences.customLocations}
          value={location}
          onValueChange={setLocation}
          onOptionsChange={updateLocationOptions}
          placeholder="選擇地點"
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
          placeholder="選擇盲注 (e.g. 1/2)"
        />
        <Text style={styles.helperText}>格式：小盲注/大盲注 (例如: 1/2, 0.5/1)</Text>
      </Card>

      <Card style={styles.section}>
        <CustomPicker
          title="Currency"
          options={preferences.customCurrencies}
          value={currency}
          onValueChange={setCurrency}
          onOptionsChange={updateCurrencyOptions}
          placeholder="選擇貨幣"
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
          placeholder="選擇桌子大小"
        />
      </Card>

      <Card style={styles.section}>
        <View style={styles.horizontalContainer}>
          <Text style={styles.fieldTitle}>Effective Stack</Text>
          <View style={styles.inputContainer}>
            <Input 
              value={effectiveStack} 
              onChangeText={setEffectiveStack} 
              placeholder="起始籌碼數量" 
              keyboardType="numeric" 
            />
          </View>
        </View>
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
    padding: theme.spacing.md,
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
  title: {
    fontSize: theme.font.size.title,
    fontWeight: '700',
    marginBottom: theme.spacing.lg,
    color: theme.colors.primary,
    textAlign: 'center',
  },
  section: {
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
  },
  horizontalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldTitle: {
    fontSize: theme.font.size.subtitle,
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
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
}); 