import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../theme';

interface HoleCardsDisplayProps {
  holeCards?: string;
  position?: string;
  fallback?: string;
}

export const HoleCardsDisplay: React.FC<HoleCardsDisplayProps> = ({
  holeCards,
  position,
  fallback,
}) => {
  const getSuitColor = (suit: string) => {
    return suit === '♥' || suit === '♦' ? '#DC2626' : '#000000';
  };

  const renderCards = () => {
    if (!holeCards) return null;
    
    return (
      <View style={styles.cardsContainer}>
        {holeCards.split(' ').map((card, index) => {
          if (!card) return null;
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
    );
  };

  const hasData = holeCards || position;
  
  if (!hasData) {
    return (
      <Text style={styles.fallbackText}>
        {fallback || ''}
      </Text>
    );
  }

  return (
    <View style={styles.container}>
      {holeCards && renderCards()}
      {position && (
        <Text style={styles.positionText}>
          {holeCards ? ` - ${position}` : position}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  cardsContainer: {
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
  positionText: {
    color: theme.colors.text,
    fontSize: theme.font.size.body,
    marginLeft: 4,
  },
  fallbackText: {
    color: theme.colors.text,
    fontSize: theme.font.size.body,
  },
}); 