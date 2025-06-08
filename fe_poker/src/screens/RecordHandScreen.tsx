import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput } from 'react-native';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { CustomPicker } from '../components/CustomPicker';
import { PokerCardPicker } from '../components/PokerCardPicker';
import { theme } from '../theme';
import { useSessionStore } from '../viewmodels/sessionStore';
import { Hand } from '../models';

export const RecordHandScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const { sessionId } = route.params;
  const [holeCards, setHoleCards] = useState('');
  const [position, setPosition] = useState('');
  const [details, setDetails] = useState('');
  const [result, setResult] = useState('');
  const { addHand, fetchHands, fetchStats } = useSessionStore();

  const positions = ['UTG', 'UTG+1', 'MP', 'HJ', 'CO', 'BTN', 'SB', 'BB'];

  const handleSave = async () => {
    const hand: Hand = {
      id: Date.now().toString(),
      sessionId,
      holeCards,
      position,
      details,
      result: parseInt(result),
      date: new Date().toISOString(),
    };
    await addHand(hand);
    await fetchHands();
    await fetchStats();
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Record Hand</Text>
      
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
        <View style={styles.topSection}>
          <View style={styles.fieldRow}>
            <PokerCardPicker
              title="Hole Cards"
              value={holeCards}
              onValueChange={setHoleCards}
            />
          </View>

          <View style={styles.fieldRow}>
            <CustomPicker
              title="Position"
              options={positions}
              value={position}
              onValueChange={setPosition}
              onOptionsChange={() => {}} // Position options are fixed
              placeholder="選擇位置"
              allowCustom={false}
              allowDelete={false}
            />
          </View>

          <View style={styles.fieldColumn}>
            <Text style={styles.label}>Hand Details</Text>
            <TextInput
              style={styles.detailsInput}
              value={details}
              onChangeText={setDetails}
              placeholder="Enter detailed hand description..."
              placeholderTextColor={theme.colors.gray}
              multiline={true}
              numberOfLines={8}
              textAlignVertical="top"
            />
          </View>
        </View>
        
        <View style={styles.spacer} />
        
        <View style={styles.bottomSection}>
          <Text style={styles.label}>Result ($)</Text>
          <Input 
            value={result} 
            onChangeText={setResult} 
            placeholder="Enter result (e.g. +150, -75)" 
            keyboardType="numeric" 
            style={styles.resultInput}
          />
          <Button title="Save Hand" onPress={handleSave} style={styles.saveButton} />
        </View>
      </ScrollView>
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
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  topSection: {
    flex: 1,
  },
  fieldRow: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.card,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  fieldColumn: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.card,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  label: {
    fontSize: theme.font.size.body,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  detailsInput: {
    backgroundColor: theme.colors.inputBg,
    borderRadius: theme.radius.input,
    padding: theme.spacing.md,
    fontSize: theme.font.size.body,
    color: theme.colors.text,
    minHeight: 200,
    maxHeight: 300,
    borderWidth: 1,
    borderColor: theme.colors.border || theme.colors.gray,
  },
  spacer: {
    flex: 1,
    minHeight: theme.spacing.lg,
  },
  bottomSection: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.card,
    padding: theme.spacing.md,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  resultInput: {
    marginBottom: theme.spacing.md,
  },
  saveButton: {
    marginTop: theme.spacing.sm,
  },
}); 