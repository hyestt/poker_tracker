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
      <Text style={styles.title}>新場次</Text>
      <Input value={location} onChangeText={setLocation} placeholder="地點" />
      <Input value={date} onChangeText={setDate} placeholder="日期/時間 (如 2024/01/15 19:30)" />
      <View style={styles.row}>
        <Input value={smallBlind} onChangeText={setSmallBlind} placeholder="小盲" keyboardType="numeric" style={{flex:1, marginRight:theme.spacing.sm}} />
        <Input value={bigBlind} onChangeText={setBigBlind} placeholder="大盲" keyboardType="numeric" style={{flex:1}} />
      </View>
      <Input value={currency} onChangeText={setCurrency} placeholder="貨幣 (USD $)" />
      <Input value={effectiveStack} onChangeText={setEffectiveStack} placeholder="起始籌碼" keyboardType="numeric" />
      <Button title="下一步" onPress={handleNext} />
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