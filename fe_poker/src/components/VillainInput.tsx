import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CustomPicker } from './CustomPicker';
import { theme } from '../theme';
import { Villain } from '../models';

interface VillainInputProps {
  villain: Villain;
  index: number;
  onUpdate: (index: number, field: 'holeCards' | 'position', value: string) => void;
  onRemove: (index: number) => void;
  onHoleCardsPress: (index: number) => void;
  positions: string[];
}

export const VillainInput: React.FC<VillainInputProps> = ({
  villain,
  index,
  onUpdate,
  onRemove,
  onHoleCardsPress,
  positions,
}) => {
  const getSuitColor = (suit: string) => {
    return suit === '♥' || suit === '♦' ? '#DC2626' : '#000000';
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.villainLabel}>Villain {index + 1}</Text>
        <TouchableOpacity onPress={() => onRemove(index)} style={styles.removeButton}>
          <Text style={styles.removeButtonText}>×</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.inputRow}>
        <View style={styles.cardSection}>
          <TouchableOpacity 
            style={styles.holeCardDisplay} 
            onPress={() => onHoleCardsPress(index)}
          >
            {villain.holeCards ? (
              <View style={styles.selectedCardsContainer}>
                {villain.holeCards.split(' ').map((card, cardIndex) => {
                  const rank = card.slice(0, -1);
                  const suit = card.slice(-1);
                  return (
                    <View key={cardIndex} style={styles.miniCard}>
                      <Text style={[styles.miniCardText, { color: getSuitColor(suit) }]}>
                        {rank}{suit}
                      </Text>
                    </View>
                  );
                })}
              </View>
            ) : (
              <Text style={styles.placeholderText}>Select cards</Text>
            )}
          </TouchableOpacity>
        </View>
        
        <View style={styles.positionSection}>
          <CustomPicker
            options={positions}
            value={villain.position || ''}
            onValueChange={(value) => onUpdate(index, 'position', value)}
            onOptionsChange={() => {}}
            placeholder="Position"
            allowCustom={false}
            allowDelete={false}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.card,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  villainLabel: {
    fontSize: theme.font.size.small,
    fontWeight: '600',
    color: theme.colors.text,
  },
  removeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.loss,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 16,
  },
  inputRow: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  cardSection: {
    flex: 1,
  },
  positionSection: {
    flex: 1,
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
    gap: 6,
  },
  miniCard: {
    backgroundColor: 'white',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: theme.colors.gray,
  },
  miniCardText: {
    fontSize: 16,
    fontWeight: '600',
  },
  placeholderText: {
    color: theme.colors.gray,
  },
}); 