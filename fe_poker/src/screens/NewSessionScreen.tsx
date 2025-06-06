import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
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
  const { addSession, fetchHands, fetchStats } = useSessionStore();

  const handleNext = async () => {
    const session: Session = {
      id: Date.now().toString(),
      location,
      date,
      smallBlind: parseInt(smallBlind),
      bigBlind: parseInt(bigBlind),
      currency,
      effectiveStack: parseInt(effectiveStack),
    };
    await addSession(session);
    await fetchHands();
    await fetchStats();
    navigation.navigate('RecordHand', { sessionId: session.id });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>New Session</Text>
      <Input value={location} onChangeText={setLocation} placeholder="Location" />
      <Input value={date} onChangeText={setDate} placeholder="Date/Time (e.g. 2024/01/15 19:30)" />
      <View style={styles.row}>
        <Input value={smallBlind} onChangeText={setSmallBlind} placeholder="Small Blind" keyboardType="numeric" style={{flex:1, marginRight:theme.spacing.sm}} />
        <Input value={bigBlind} onChangeText={setBigBlind} placeholder="Big Blind" keyboardType="numeric" style={{flex:1}} />
      </View>
      <Input value={currency} onChangeText={setCurrency} placeholder="Currency (USD $)" />
      <Input value={effectiveStack} onChangeText={setEffectiveStack} placeholder="Starting Stack" keyboardType="numeric" />
      <Button title="Next" onPress={handleNext} />
    </View>
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
    marginBottom: theme.spacing.md,
    color: theme.colors.primary,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    marginBottom: theme.spacing.sm,
  },
}); 