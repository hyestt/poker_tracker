import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput } from 'react-native';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { theme } from '../theme';
import { useSessionStore } from '../viewmodels/sessionStore';
import { Hand } from '../models';

export const RecordHandScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const { sessionId } = route.params;
  const [details, setDetails] = useState('');
  const [result, setResult] = useState('');
  const { addHand, fetchHands, fetchStats } = useSessionStore();

  const handleSave = async () => {
    const hand: Hand = {
      id: Date.now().toString(),
      sessionId,
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
    paddingTop: theme.spacing.md,
  },
  resultInput: {
    marginBottom: theme.spacing.md,
  },
  saveButton: {
    marginTop: theme.spacing.sm,
  },
}); 