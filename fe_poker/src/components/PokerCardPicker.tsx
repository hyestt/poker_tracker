import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList } from 'react-native';
import { theme } from '../theme';

interface PokerCardPickerProps {
  value: string;
  onValueChange: (value: string) => void;
  title?: string;
}

export const PokerCardPicker: React.FC<PokerCardPickerProps> = ({
  value,
  onValueChange,
  title,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [selectedCards, setSelectedCards] = useState<string[]>(
    value ? value.split(' ') : []
  );

  const suits = ['♠', '♥', '♦', '♣'];
  const ranks = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];

  const generateDeck = () => {
    const deck: string[] = [];
    ranks.forEach(rank => {
      suits.forEach(suit => {
        deck.push(`${rank}${suit}`);
      });
    });
    return deck;
  };

  const deck = generateDeck();

  const getSuitColor = (suit: string) => {
    return suit === '♥' || suit === '♦' ? '#DC2626' : '#000000';
  };

  const handleCardSelect = (card: string) => {
    let newSelectedCards = [...selectedCards];
    
    if (newSelectedCards.includes(card)) {
      // Remove card if already selected
      newSelectedCards = newSelectedCards.filter(c => c !== card);
    } else if (newSelectedCards.length < 2) {
      // Add card if less than 2 selected
      newSelectedCards.push(card);
    }
    
    setSelectedCards(newSelectedCards);
    
    // Auto confirm when 2 cards are selected
    if (newSelectedCards.length === 2) {
      setTimeout(() => {
        const holeCards = newSelectedCards.join(' ');
        onValueChange(holeCards);
        setIsVisible(false);
      }, 200);
    }
  };

  const handleConfirm = () => {
    const holeCards = selectedCards.join(' ');
    onValueChange(holeCards);
    setIsVisible(false);
  };

  const handleCancel = () => {
    setSelectedCards(value ? value.split(' ') : []);
    setIsVisible(false);
  };

  const renderCard = ({ item }: { item: string }) => {
    const isSelected = selectedCards.includes(item);
    const rank = item.slice(0, -1);
    const suit = item.slice(-1);
    
    return (
      <TouchableOpacity
        style={[styles.card, isSelected && styles.selectedCard]}
        onPress={() => handleCardSelect(item)}
      >
        <Text style={[styles.cardRank, { color: getSuitColor(suit) }]}>
          {rank}
        </Text>
        <Text style={[styles.cardSuit, { color: getSuitColor(suit) }]}>
          {suit}
        </Text>
      </TouchableOpacity>
    );
  };

  const PickerComponent = () => (
    <TouchableOpacity style={styles.picker} onPress={() => setIsVisible(true)}>
      {value ? (
        <View style={styles.selectedCardsContainer}>
          {value.split(' ').map((card, index) => {
            const rank = card.slice(0, -1);
            const suit = card.slice(-1);
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
        <Text style={[styles.pickerText, styles.placeholderText]}>
          Hole Card
        </Text>
      )}
    </TouchableOpacity>
  );

  if (title) {
    return (
      <View>
        <View style={styles.horizontalContainer}>
          <Text style={styles.titleText}>{title}</Text>
          <View style={styles.pickerContainer}>
            <PickerComponent />
          </View>
        </View>

        <Modal
          visible={isVisible}
          transparent
          animationType="fade"
          onRequestClose={handleCancel}
        >
          <View style={styles.overlay}>
            <View style={styles.modal}>
              <Text style={styles.modalTitle}>Select Hole Cards (max 2)</Text>
              <Text style={styles.selectedInfo}>
                Selected: {selectedCards.length}/2
              </Text>

              <FlatList
                data={deck}
                renderItem={renderCard}
                keyExtractor={(item) => item}
                numColumns={4}
                style={styles.cardGrid}
                showsVerticalScrollIndicator={false}
              />

              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.button} onPress={handleCancel}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.button, styles.confirmButton]} 
                  onPress={handleConfirm}
                >
                  <Text style={styles.confirmButtonText}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  return (
    <View>
      <PickerComponent />

      <Modal
        visible={isVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCancel}
      >
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Select Hole Cards (max 2)</Text>
            <Text style={styles.selectedInfo}>
              Selected: {selectedCards.length}/2
            </Text>

            <FlatList
              data={deck}
              renderItem={renderCard}
              keyExtractor={(item) => item}
              numColumns={4}
              style={styles.cardGrid}
              showsVerticalScrollIndicator={false}
            />

            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.button} onPress={handleCancel}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.button, styles.confirmButton]} 
                onPress={handleConfirm}
              >
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  horizontalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  titleText: {
    fontSize: theme.font.size.small,
    fontWeight: '600',
    color: theme.colors.text,
    flex: 0.3,
  },
  pickerContainer: {
    flex: 0.65,
  },
  picker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.inputBg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.input,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
    minHeight: 40,
  },
  pickerText: {
    fontSize: theme.font.size.small,
    color: theme.colors.text,
    flex: 1,
  },
  placeholderText: {
    color: theme.colors.gray,
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
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: theme.radius.card,
    padding: theme.spacing.lg,
    margin: theme.spacing.lg,
    maxHeight: '80%',
    minWidth: '90%',
  },
  modalTitle: {
    fontSize: theme.font.size.subtitle,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
    color: theme.colors.text,
  },
  selectedInfo: {
    fontSize: theme.font.size.small,
    color: theme.colors.gray,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  cardGrid: {
    maxHeight: 400,
    marginBottom: theme.spacing.md,
  },
  card: {
    width: 60,
    height: 80,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: theme.colors.gray,
    margin: 4,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  selectedCard: {
    borderColor: theme.colors.primary,
    backgroundColor: '#E3F2FD',
  },
  cardRank: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  cardSuit: {
    fontSize: 18,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  button: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.button,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.gray,
  },
  confirmButton: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  cancelButtonText: {
    color: theme.colors.gray,
    fontSize: theme.font.size.body,
  },
  confirmButtonText: {
    color: 'white',
    fontSize: theme.font.size.body,
    fontWeight: '600',
  },
}); 