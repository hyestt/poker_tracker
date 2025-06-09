import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../theme';
import { usePokerKeyboardViewModel } from '../viewmodels/PokerKeyboardViewModel';

interface PokerKeyboardViewProps {
  onBack?: () => void;
  onSave?: () => void;
  onCardSelect?: (cards: string[]) => void;
  initialAction?: 'hole' | 'position';
  initialCards?: string[];
  onDone?: () => void;
}

export const PokerKeyboardView: React.FC<PokerKeyboardViewProps> = ({
  onBack,
  onSave,
  onCardSelect,
  initialAction = 'hole',
  initialCards = [],
  onDone
}) => {
  const viewModel = usePokerKeyboardViewModel(initialAction, 5, initialCards);
  const { state, actions } = viewModel;

  // 監聽卡牌變化並通知父組件
  useEffect(() => {
    const cardDisplays = state.inputCards.map(c => c.display);
    onCardSelect?.(cardDisplays);
  }, [state.inputCards, onCardSelect]);

  const firstRow = ['5', '4', '3', '2'];
  const secondRow = ['9', '8', '7', '6'];
  const thirdRow = ['A', 'K', 'Q', 'J', 'T'];
  const suits = [
    { label: 'Club', symbol: '♣', color: '#22C55E' },
    { label: 'Spade', symbol: '♠', color: '#000000' },
    { label: 'Heart', symbol: '♥', color: '#EF4444' },
    { label: 'Diamond', symbol: '♦', color: '#A855F7' }
  ];

  const handleActionSelect = (action: 'hole' | 'position') => {
    actions.setSelectedAction(action);
  };

  const handleRankSelect = (rank: string) => {
    actions.selectRank(rank);
    
    // 如果同時有rank和suit，自動組成卡牌
    if (state.selectedSuit) {
      actions.addCard(rank, state.selectedSuit);
    }
  };

  const handleSuitSelect = (suitSymbol: string) => {
    actions.selectSuit(suitSymbol);
    
    // 如果同時有rank和suit，自動組成卡牌
    if (state.selectedRank) {
      actions.addCard(state.selectedRank, suitSymbol);
    }
  };

  const handleAdd = () => {
    if (state.selectedRank && state.selectedSuit) {
      actions.addCard(state.selectedRank, state.selectedSuit);
    }
  };

  const handleDone = () => {
    onDone?.();
  };

  const handleClear = () => {
    // 只刪除最右邊（最後一張）的卡片
    if (state.inputCards.length > 0) {
      actions.removeCard(state.inputCards.length - 1);
    }
  };

  const getSuitColor = (suitSymbol: string) => {
    const suit = suits.find(s => s.symbol === suitSymbol);
    return suit ? suit.color : '#000000';
  };

  return (
    <View style={styles.container}>
      {/* Selected Cards Display */}
      <View style={styles.selectedCardsDisplay}>
        <View style={styles.cardsSection}>
          {/* Selected Cards */}
          <View style={styles.selectedCardsContainer}>
            {state.inputCards.map((card, index) => {
              const suitColor = getSuitColor(card.suit);
              return (
                <View 
                  key={index} 
                  style={styles.selectedCard}
                >
                  <Text style={[styles.selectedCardText, { color: suitColor }]}>
                    {card.display}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Current input preview */}
          {(state.selectedRank || state.selectedSuit) && (
            <View style={styles.currentInputSection}>
              <View style={styles.currentInputCard}>
                <Text style={[
                  styles.currentInputText, 
                  { color: state.selectedSuit ? getSuitColor(state.selectedSuit) : '#92400E' }
                ]}>
                  {state.selectedRank || '?'}{state.selectedSuit || '?'}
                </Text>
              </View>
            </View>
          )}
        </View>

        {state.inputCards.length === 0 && !state.selectedRank && !state.selectedSuit && (
          <Text style={styles.emptyStateText}>Click rank and suit to select cards (max 5)</Text>
        )}
      </View>

      {/* Rank Grid with buttons */}
      <View style={styles.rankSection}>
        {/* First Row - 5432 with + button */}
        <View style={styles.rankRow}>
          {firstRow.map((rank) => (
            <TouchableOpacity
              key={rank}
              style={[
                styles.rankButton,
                state.selectedRank === rank && styles.rankButtonSelected
              ]}
              onPress={() => handleRankSelect(rank)}
            >
              <Text style={[
                styles.rankButtonText,
                state.selectedRank === rank && styles.rankButtonTextSelected
              ]}>
                {rank}
              </Text>
            </TouchableOpacity>
          ))}
          
          {/* Add Done button to the right of 5432 */}
          <TouchableOpacity
            style={styles.symbolButton}
            onPress={handleDone}
          >
            <Text style={styles.symbolButtonText}>✓</Text>
          </TouchableOpacity>
        </View>

        {/* Second Row - 9876 with × button */}
        <View style={styles.rankRow}>
          {secondRow.map((rank) => (
            <TouchableOpacity
              key={rank}
              style={[
                styles.rankButton,
                state.selectedRank === rank && styles.rankButtonSelected
              ]}
              onPress={() => handleRankSelect(rank)}
            >
              <Text style={[
                styles.rankButtonText,
                state.selectedRank === rank && styles.rankButtonTextSelected
              ]}>
                {rank}
              </Text>
            </TouchableOpacity>
          ))}
          
          {/* Add × button to the right of 9876 */}
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClear}
          >
            <Text style={styles.clearButtonText}>×</Text>
          </TouchableOpacity>
        </View>

        {/* Third Row - AKQJT */}
        <View style={[styles.rankRow, styles.lastRankRow]}>
          {thirdRow.map((rank) => (
            <TouchableOpacity
              key={rank}
              style={[
                styles.rankButton,
                state.selectedRank === rank && styles.rankButtonSelected
              ]}
              onPress={() => handleRankSelect(rank)}
            >
              <Text style={[
                styles.rankButtonText,
                state.selectedRank === rank && styles.rankButtonTextSelected
              ]}>
                {rank}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Suit Selector - Move to bottom */}
      <View style={styles.suitSelector}>
        {suits.map((suit) => (
          <TouchableOpacity
            key={suit.label}
            style={[
              styles.suitButton,
              { borderColor: suit.color },
              state.selectedSuit === suit.symbol && { backgroundColor: suit.color + '20' }
            ]}
            onPress={() => handleSuitSelect(suit.symbol)}
          >
            <Text style={[styles.suitSymbol, { color: suit.color }]}>
              {suit.symbol}
            </Text>
            <Text style={[styles.suitLabel, { color: suit.color }]}>
              {suit.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    paddingHorizontal: theme.spacing.md,
    paddingTop: 0,
    paddingBottom: theme.spacing.sm,
    justifyContent: 'flex-end',
  },
  selectedCardsDisplay: {
    backgroundColor: 'white',
    borderRadius: theme.radius.card,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    minHeight: 120,
    justifyContent: 'center',
  },
  selectedCardsTitle: {
    fontSize: theme.font.size.subtitle,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  selectedCardsContainer: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: theme.spacing.xs,
    justifyContent: 'center',
    flex: 1,
    alignItems: 'center',
  },
  selectedCard: {
    backgroundColor: '#F3F4F6',
    borderRadius: theme.radius.button,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
    minWidth: 45,
    alignItems: 'center',
  },
  selectedCardText: {
    fontSize: theme.font.size.body,
    fontWeight: '700',
    color: theme.colors.text,
  },
  emptyStateText: {
    fontSize: theme.font.size.body,
    color: theme.colors.gray,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  rankSection: {
    justifyContent: 'flex-start',
    paddingHorizontal: theme.spacing.sm,
    marginBottom: 0,
  },
  rankRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
    gap: theme.spacing.sm,
  },
  rankButton: {
    width: 60,
    height: 60,
    backgroundColor: '#3B82F6',
    borderRadius: theme.radius.button,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  rankButtonSelected: {
    backgroundColor: '#1D4ED8',
    transform: [{ scale: 0.95 }],
  },
  rankButtonText: {
    fontSize: 24,
    color: 'white',
    fontWeight: '700',
  },
  rankButtonTextSelected: {
    color: 'white',
  },
  controlButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: theme.spacing.xl,
  },
  symbolButton: {
    width: 60,
    height: 60,
    backgroundColor: '#10B981',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  symbolButtonText: {
    fontSize: 24,
    color: 'white',
    fontWeight: '700',
  },
  clearButton: {
    width: 60,
    height: 60,
    backgroundColor: '#EF4444',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  clearButtonText: {
    fontSize: 20,
    color: 'white',
    fontWeight: '700',
  },
  suitSelector: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
  },
  suitButton: {
    flex: 1,
    paddingVertical: theme.spacing.lg,
    backgroundColor: 'white',
    borderRadius: theme.radius.card,
    borderWidth: 2,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  suitSymbol: {
    fontSize: 32,
    marginBottom: theme.spacing.xs,
  },
  suitLabel: {
    fontSize: theme.font.size.small,
    fontWeight: '600',
  },
  cardsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  currentInputSection: {
    alignItems: 'center',
    flexShrink: 0,
  },
  currentInputLabel: {
    fontSize: theme.font.size.small,
    color: theme.colors.gray,
    marginBottom: theme.spacing.xs,
  },
  currentInputCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: theme.radius.button,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderWidth: 2,
    borderColor: '#F59E0B',
    borderStyle: 'dashed',
  },
  currentInputText: {
    fontSize: theme.font.size.body,
    fontWeight: '700',
    color: '#92400E',
  },
  lastRankRow: {
    marginBottom: theme.spacing.sm,
  },
}); 