import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { theme } from '../theme';
import { useSessionStore } from '../viewmodels/sessionStore';
import { Hand } from '../models';

export const RecordHandScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const { sessionId } = route.params;
  const [details, setDetails] = useState('');
  const [result, setResult] = useState('');
  const { addHand } = useSessionStore();

  const handleSave = () => {
    const hand: Hand = {
      id: Date.now().toString(),
      sessionId,
      details,
      result: parseInt(result),
      date: new Date().toISOString(),
    };
    addHand(hand);
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>紀錄手牌</Text>
      <Input value={details} onChangeText={setDetails} placeholder="手牌細節" />
      <Input value={result} onChangeText={setResult} placeholder="結果 ($)" keyboardType="numeric" />
      <Button title="儲存手牌" onPress={handleSave} />
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
}); 