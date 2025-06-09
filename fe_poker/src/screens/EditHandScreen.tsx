import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Modal, SafeAreaView } from 'react-native';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { CustomPicker } from '../components/CustomPicker';
import { PokerKeyboardView } from '../components/PokerKeyboardView';
import { theme } from '../theme';
import { useSessionStore } from '../viewmodels/sessionStore';
import { Hand } from '../models';

export const EditHandScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  console.log('EditHandScreen route params:', route.params);
  const { handId } = route.params;
  console.log('EditHandScreen handId:', handId);
  const [holeCards, setHoleCards] = useState('');
  const [position, setPosition] = useState('');
  const [details, setDetails] = useState('');
  const [result, setResult] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [loading, setLoading] = useState(true);
  const [showPokerKeyboard, setShowPokerKeyboard] = useState(false);
  const { updateHand, getHand, fetchHands, fetchStats } = useSessionStore();

  const positions = ['UTG', 'UTG+1', 'MP', 'HJ', 'CO', 'BTN', 'SB', 'BB'];

  const handleHoleCardsSelect = () => {
    setShowPokerKeyboard(true);
  };

  const handlePokerKeyboardClose = () => {
    setShowPokerKeyboard(false);
  };

  const handleCardSelect = (selectedCards: string[]) => {
    setHoleCards(selectedCards.join(' '));
  };

  useEffect(() => {
    const loadHand = async () => {
      try {
        console.log('Loading hand with ID:', handId);
        const hand = await getHand(handId);
        console.log('Loaded hand data:', hand);
        setHoleCards(hand.holeCards || '');
        setPosition(hand.position || '');
        setDetails(hand.details || '');
        setResult(hand.result.toString());
        setSessionId(hand.sessionId);
        setLoading(false);
      } catch (error) {
        console.error('Failed to load hand:', error);
        setLoading(false);
      }
    };
    
    if (handId) {
      loadHand();
    } else {
      console.error('No handId provided');
      setLoading(false);
    }
  }, [handId, getHand]);

  const handleSave = async () => {
    const hand: Hand = {
      id: handId,
      sessionId,
      holeCards,
      position,
      details,
      result: parseInt(result) || 0,
      date: new Date().toISOString(),
    };
    await updateHand(hand);
    await fetchHands();
    await fetchStats();
    navigation.goBack();
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.loadingText}>Loading hand data...</Text>
        <Text style={styles.loadingText}>Hand ID: {handId}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>      
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
        <View style={styles.topSection}>
          <View style={styles.resultSection}>
            <Text style={styles.label}>Result ($)</Text>
            <Input 
              value={result} 
              onChangeText={setResult} 
              placeholder="Enter result (e.g. +150, -75)" 
              keyboardType="numeric" 
              style={styles.resultInput}
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
          <View style={styles.horizontalRow}>
            <View style={styles.halfField}>
              <Text style={styles.fieldLabel}>Hole Cards</Text>
              <TouchableOpacity style={styles.holeCardDisplay} onPress={handleHoleCardsSelect}>
                {holeCards ? (
                  <View style={styles.selectedCardsContainer}>
                    {holeCards.split(' ').map((card, index) => {
                      const rank = card.slice(0, -1);
                      const suit = card.slice(-1);
                      const getSuitColor = (suit: string) => {
                        return suit === '♥' || suit === '♦' ? '#DC2626' : '#000000';
                      };
                      return (
                        <View key={index} style={styles.miniCard}>
                          <Text style={[styles.miniCardText, { color: getSuitColor(suit) }]}>
                            {rank}{suit}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                ) : (
                  <Text style={styles.placeholderText}>
                    Select hole cards
                  </Text>
                )}
              </TouchableOpacity>
            </View>
            <View style={styles.halfField}>
              <CustomPicker
                title="Position"
                options={positions}
                value={position}
                onValueChange={setPosition}
                onOptionsChange={() => {}} // Position options are fixed
                placeholder="Select position"
                allowCustom={false}
                allowDelete={false}
              />
            </View>
          </View>
          <Button title="Update Hand" onPress={handleSave} style={styles.saveButton} />
        </View>
      </ScrollView>

      {/* Poker Keyboard Modal */}
      <Modal
        visible={showPokerKeyboard}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handlePokerKeyboardClose}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={handlePokerKeyboardClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Hole Cards</Text>
            <TouchableOpacity onPress={handlePokerKeyboardClose} style={styles.doneButton}>
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
          
          <PokerKeyboardView
            onCardSelect={handleCardSelect}
            initialAction="hole"
            initialCards={holeCards ? holeCards.split(' ') : []}
            onDone={handlePokerKeyboardClose}
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.xs,
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
  resultSection: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.card,
    padding: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  fieldColumn: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.card,
    padding: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
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
    padding: theme.spacing.xs,
    fontSize: theme.font.size.body,
    color: theme.colors.text,
    minHeight: 200,
    maxHeight: 300,
    borderWidth: 1,
    borderColor: theme.colors.border || theme.colors.gray,
  },
  spacer: {
    flex: 1,
    minHeight: theme.spacing.sm,
  },
  bottomSection: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.card,
    padding: theme.spacing.xs,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  resultInput: {
    marginBottom: theme.spacing.xs,
  },
  saveButton: {
    marginTop: theme.spacing.xs,
  },
  loadingText: {
    fontSize: theme.font.size.body,
    color: theme.colors.text,
  },
  fieldLabel: {
    fontSize: theme.font.size.small,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  holeCardDisplay: {
    backgroundColor: theme.colors.inputBg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.input,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
    minHeight: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedCardsContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  miniCard: {
    backgroundColor: 'white',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: theme.colors.gray,
  },
  miniCardText: {
    fontSize: 12,
    fontWeight: '600',
  },
  placeholderText: {
    color: theme.colors.gray,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  closeButton: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  closeButtonText: {
    fontSize: theme.font.size.body,
    color: theme.colors.gray,
    fontWeight: '600',
  },
  modalTitle: {
    fontSize: theme.font.size.subtitle,
    fontWeight: '700',
    color: theme.colors.text,
  },
  doneButton: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  doneButtonText: {
    fontSize: theme.font.size.body,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  horizontalRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing.xs,
    gap: theme.spacing.xs,
  },
  halfField: {
    flex: 1,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.card,
    padding: theme.spacing.xs,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
}); 