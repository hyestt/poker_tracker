import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Input } from './Input';
import { Button } from './Button';
import { Card } from './Card';
import { CustomPicker } from './CustomPicker';
import { CustomDateTimePicker } from './DateTimePicker';
import { ColorTagPicker } from './ColorTagPicker';
import { theme } from '../theme';
import { Session } from '../models';
import { UserPreferencesService, UserPreferences } from '../services/UserPreferences';

interface SessionFormProps {
  initialSession?: Session;
  onSubmit: (session: Session) => void;
  submitButtonTitle: string;
  isLoading?: boolean;
}

export const SessionForm: React.FC<SessionFormProps> = ({
  initialSession,
  onSubmit,
  submitButtonTitle,
  isLoading = false
}) => {
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [blinds, setBlinds] = useState('');
  const [currency, setCurrency] = useState('');
  const [effectiveStack, setEffectiveStack] = useState('');
  const [tableSize, setTableSize] = useState('');
  const [tag, setTag] = useState('');
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);

  useEffect(() => {
    console.log('🔄 SessionForm useEffect triggered, initialSession:', initialSession);
    loadPreferencesAndInitialize();
  }, []); // 暫時移除 initialSession 依賴來測試

  // 監控 date state 的變化
  useEffect(() => {
    console.log('📅 Date state changed to:', date);
  }, [date]);

  const loadPreferencesAndInitialize = async () => {
    const prefs = await UserPreferencesService.getPreferences();
    setPreferences(prefs);
    
    if (initialSession) {
      // Edit mode - populate with existing session data
      setLocation(initialSession.location || '');
      setDate(initialSession.date || '');
      setCurrency(initialSession.currency || '');
      setEffectiveStack(initialSession.effectiveStack?.toString() || '');
      setTableSize(initialSession.tableSize?.toString() || '');
      setTag(initialSession.tag || '');
      
      // Format blinds as "smallBlind/bigBlind"
      setBlinds(`${initialSession.smallBlind || 0}/${initialSession.bigBlind || 0}`);
    } else {
      // New session mode - set default values from preferences
      setLocation(prefs.lastLocation || '');
      setCurrency(prefs.lastCurrency || '🇺🇸 USD ($)');
      setTableSize(prefs.lastTableSize || '6');
      setBlinds(prefs.lastBlinds || '1/2');
      setEffectiveStack('100');
      
      // Set current date and time as default
      const now = new Date();
      const formattedDate = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      console.log('📅 SessionForm: Setting initial date to:', formattedDate);
      setDate(formattedDate);
    }
  };

  const handleSubmit = async () => {
    // Parse blinds (format: "1/2" -> smallBlind: 1, bigBlind: 2)
    const [smallBlindStr, bigBlindStr] = blinds.split('/');
    const smallBlindValue = parseFloat(smallBlindStr) || 0;
    const bigBlindValue = parseFloat(bigBlindStr) || 0;

    const session: Session = {
      id: initialSession?.id || Date.now().toString(),
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

    onSubmit(session);
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
          onValueChange={(newDate) => {
            console.log('🔄 SessionForm: Date value changed from', date, 'to', newDate);
            setDate(newDate);
          }}
        />
        {/* 測試按鈕 */}
        <TouchableOpacity 
          style={{backgroundColor: 'green', padding: 10, marginTop: 10, borderRadius: 5}}
          onPress={() => {
            const testDate = '2025/01/01 12:30';
            console.log('🧪 Test: Setting date to', testDate);
            Alert.alert('Test', `Setting date to: ${testDate}\nCurrent date: ${date}`);
            setDate(testDate);
          }}
        >
          <Text style={{color: 'white', textAlign: 'center'}}>Test Set Date</Text>
        </TouchableOpacity>
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
          allowCustom={false}
          allowDelete={false}
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
        <Button 
          title={submitButtonTitle} 
          onPress={handleSubmit}
          disabled={isLoading}
        />
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
  buttonContainer: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
}); 