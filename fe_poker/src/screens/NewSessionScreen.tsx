import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { theme } from '../theme';
import { useSessionStore } from '../viewmodels/sessionStore';
import { Session } from '../models';

export const NewSessionScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [smallBlind, setSmallBlind] = useState('');
  const [bigBlind, setBigBlind] = useState('');
  const [currency, setCurrency] = useState('USD ($)');
  const [effectiveStack, setEffectiveStack] = useState('');
  const [tableSize, setTableSize] = useState('6');
  const { addSession, fetchHands, fetchStats } = useSessionStore();

  const currencyOptions = ['USD ($)', 'EUR (€)', 'GBP (£)', 'JPY (¥)', 'CNY (¥)'];
  const tableSizeOptions = ['2', '4', '6', '8', '9', '10'];
  const locationPresets = ['Live Casino', 'Home Game', 'Online', 'Club'];

  const handleNext = async () => {
    const session: Session = {
      id: Date.now().toString(),
      location,
      date,
      smallBlind: parseInt(smallBlind) || 0,
      bigBlind: parseInt(bigBlind) || 0,
      currency,
      effectiveStack: parseInt(effectiveStack) || 0,
      tableSize: parseInt(tableSize) || 6,
    };
    await addSession(session);
    await fetchHands();
    await fetchStats();
    navigation.navigate('RecordHand', { sessionId: session.id });
  };

  const OptionButton = ({ title, isSelected, onPress }: { title: string, isSelected: boolean, onPress: () => void }) => (
    <TouchableOpacity 
      style={[styles.optionButton, isSelected && styles.selectedOption]} 
      onPress={onPress}
    >
      <Text style={[styles.optionText, isSelected && styles.selectedOptionText]}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>New Session Setup</Text>
      
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Location</Text>
        <View style={styles.optionsRow}>
          {locationPresets.map((preset) => (
            <OptionButton
              key={preset}
              title={preset}
              isSelected={location === preset}
              onPress={() => setLocation(preset)}
            />
          ))}
        </View>
        <Input 
          value={location} 
          onChangeText={setLocation} 
          placeholder="Custom location..." 
          style={styles.customInput}
        />
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Date & Time</Text>
        <Input 
          value={date} 
          onChangeText={setDate} 
          placeholder="e.g. 2024/01/15 19:30" 
        />
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Blinds</Text>
        <View style={styles.blindsRow}>
          <View style={styles.blindInput}>
            <Text style={styles.inputLabel}>Small Blind</Text>
            <Input 
              value={smallBlind} 
              onChangeText={setSmallBlind} 
              placeholder="1" 
              keyboardType="numeric" 
            />
          </View>
          <View style={styles.blindInput}>
            <Text style={styles.inputLabel}>Big Blind</Text>
            <Input 
              value={bigBlind} 
              onChangeText={setBigBlind} 
              placeholder="2" 
              keyboardType="numeric" 
            />
          </View>
        </View>
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Currency</Text>
        <View style={styles.optionsGrid}>
          {currencyOptions.map((curr) => (
            <OptionButton
              key={curr}
              title={curr}
              isSelected={currency === curr}
              onPress={() => setCurrency(curr)}
            />
          ))}
        </View>
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Effective Stack</Text>
        <Input 
          value={effectiveStack} 
          onChangeText={setEffectiveStack} 
          placeholder="Starting stack amount" 
          keyboardType="numeric" 
        />
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Table Size</Text>
        <View style={styles.optionsRow}>
          {tableSizeOptions.map((size) => (
            <OptionButton
              key={size}
              title={`${size} Players`}
              isSelected={tableSize === size}
              onPress={() => setTableSize(size)}
            />
          ))}
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
  sectionTitle: {
    fontSize: theme.font.size.subtitle,
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
    color: theme.colors.text,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  optionButton: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.button,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.gray,
  },
  selectedOption: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  optionText: {
    fontSize: theme.font.size.body,
    color: theme.colors.text,
    fontWeight: '500',
  },
  selectedOptionText: {
    color: '#fff',
    fontWeight: '600',
  },
  customInput: {
    marginTop: theme.spacing.xs,
  },
  blindsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  blindInput: {
    flex: 1,
  },
  inputLabel: {
    fontSize: theme.font.size.small,
    color: theme.colors.gray,
    marginBottom: theme.spacing.xs,
    fontWeight: '500',
  },
  buttonContainer: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
}); 