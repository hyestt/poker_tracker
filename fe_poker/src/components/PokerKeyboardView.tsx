import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../theme';
import { usePokerKeyboardViewModel } from '../viewmodels/PokerKeyboardViewModel';

interface PokerKeyboardViewProps {
  onBack?: () => void;
  onSave?: () => void;
  onCardSelect?: (cards: string[]) => void;
  initialAction?: 'hole' | 'position';
}

export const PokerKeyboardView: React.FC<PokerKeyboardViewProps> = ({
  onBack,
  onSave,
  onCardSelect,
  initialAction = 'hole'
}) => {
  const viewModel = usePokerKeyboardViewModel(initialAction);
  const { state, actions } = viewModel;

  const ranks = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
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
      // 通知父組件卡牌變化
      const updatedCards = [...state.inputCards.map(c => c.display), `${rank}${state.selectedSuit}`];
      onCardSelect?.(updatedCards);
    }
  };

  const handleSuitSelect = (suitSymbol: string) => {
    actions.selectSuit(suitSymbol);
    
    // 如果同時有rank和suit，自動組成卡牌
    if (state.selectedRank) {
      actions.addCard(state.selectedRank, suitSymbol);
      // 通知父組件卡牌變化
      const updatedCards = [...state.inputCards.map(c => c.display), `${state.selectedRank}${suitSymbol}`];
      onCardSelect?.(updatedCards);
    }
  };

  const handleAdd = () => {
    if (state.selectedRank && state.selectedSuit) {
      actions.addCard(state.selectedRank, state.selectedSuit);
      // 通知父組件卡牌變化
      const updatedCards = [...state.inputCards.map(c => c.display), `${state.selectedRank}${state.selectedSuit}`];
      onCardSelect?.(updatedCards);
    }
  };

  const handleClear = () => {
    actions.clearAll();
    onCardSelect?.([]);
  };

  return (
    <View style={styles.container}>
      {/* Selected Cards Display */}
      <View style={styles.selectedCardsDisplay}>
        <Text style={styles.selectedCardsTitle}>已選擇的手牌</Text>
        
        <View style={styles.cardsSection}>
          {/* 已完成的卡牌 */}
          <View style={styles.selectedCardsContainer}>
            {state.inputCards.map((card, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.selectedCard}
                onPress={() => {
                  actions.removeCard(index);
                  const updatedCards = state.inputCards
                    .filter((_, i) => i !== index)
                    .map(c => c.display);
                  onCardSelect?.(updatedCards);
                }}
              >
                <Text style={styles.selectedCardText}>{card.display}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 正在輸入的卡牌預覽 */}
          {(state.selectedRank || state.selectedSuit) && (
            <View style={styles.currentInputSection}>
              <Text style={styles.currentInputLabel}>正在輸入：</Text>
              <View style={styles.currentInputCard}>
                <Text style={styles.currentInputText}>
                  {state.selectedRank || '?'}{state.selectedSuit || '?'}
                </Text>
              </View>
            </View>
          )}
        </View>

        {state.inputCards.length === 0 && !state.selectedRank && !state.selectedSuit && (
          <Text style={styles.emptyStateText}>點擊數字和花色來選擇手牌</Text>
        )}
      </View>

      {/* Card Input Grid */}
      <View style={styles.cardInputGrid}>
        {/* Rank Grid */}
        <View style={styles.rankGrid}>
          {ranks.map((rank) => (
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

        {/* Control Buttons */}
        <View style={styles.controlButtons}>
          <TouchableOpacity
            style={styles.symbolButton}
            onPress={handleAdd}
          >
            <Text style={styles.symbolButtonText}>+</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClear}
          >
            <Text style={styles.clearButtonText}>✕</Text>
          </TouchableOpacity>
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
    paddingVertical: theme.spacing.md,
  },
  selectedCardsDisplay: {
    backgroundColor: 'white',
    borderRadius: theme.radius.card,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    minHeight: 100,
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
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    justifyContent: 'center',
  },
  selectedCard: {
    backgroundColor: '#F3F4F6',
    borderRadius: theme.radius.button,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
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
  cardInputGrid: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: 120, // 為底部的花色選擇器留出空間
  },
  rankGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  rankButton: {
    width: '22%',
    aspectRatio: 1,
    backgroundColor: '#3B82F6',
    borderRadius: theme.radius.button,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
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
    fontSize: theme.font.size.subtitle,
    color: 'white',
    fontWeight: '700',
  },
  rankButtonTextSelected: {
    color: 'white',
  },
  controlButtons: {
    gap: theme.spacing.sm,
  },
  symbolButton: {
    width: 50,
    height: 50,
    backgroundColor: '#10B981',
    borderRadius: 25,
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
    width: 50,
    height: 50,
    backgroundColor: '#EF4444',
    borderRadius: 25,
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
    position: 'absolute',
    bottom: 0,
    left: theme.spacing.md,
    right: theme.spacing.md,
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
    alignItems: 'center',
  },
  currentInputSection: {
    marginTop: theme.spacing.md,
    alignItems: 'center',
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
}); 