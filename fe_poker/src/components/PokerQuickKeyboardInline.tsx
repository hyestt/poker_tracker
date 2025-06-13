import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { theme } from '../theme';

interface PokerQuickKeyboardInlineProps {
  onQuickInsert: (text: string) => void;
  onQuickDelete: () => void;
  onDeletePressIn: () => void;
  onDeletePressOut: () => void;
}

export const PokerQuickKeyboardInline: React.FC<PokerQuickKeyboardInlineProps> = ({
  onQuickInsert,
  onQuickDelete,
  onDeletePressIn,
  onDeletePressOut,
}) => {
  return (
    <View style={styles.quickButtonsSection}>
      {/* Round Buttons */}
      <View style={styles.buttonCategory}>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.quickButton, styles.roundButton]}
            onPress={() => onQuickInsert('Preflop: \n')}
          >
            <Text style={[styles.quickButtonText, styles.roundButtonText]}>PF</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickButton, styles.roundButton]}
            onPress={() => onQuickInsert('Flop: \n')}
          >
            <Text style={[styles.quickButtonText, styles.roundButtonText]}>F</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickButton, styles.roundButton]}
            onPress={() => onQuickInsert('Turn: \n')}
          >
            <Text style={[styles.quickButtonText, styles.roundButtonText]}>T</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickButton, styles.roundButton]}
            onPress={() => onQuickInsert('River: \n')}
          >
            <Text style={[styles.quickButtonText, styles.roundButtonText]}>R</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickButton, styles.compactButton]}
            onPress={() => onQuickInsert('UTG1 ')}
          >
            <Text style={styles.quickButtonText}>UTG1</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickButton, styles.compactButton]}
            onPress={() => onQuickInsert('UTG2 ')}
          >
            <Text style={styles.quickButtonText}>UTG2</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickButton}
            onPress={() => onQuickInsert('Hero ')}
          >
            <Text style={styles.quickButtonText}>H</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickButton}
            onPress={() => onQuickInsert('Villain ')}
          >
            <Text style={styles.quickButtonText}>V</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Position Buttons */}
      <View style={styles.buttonCategory}>
        <View style={styles.buttonRow}>
          {['UTG', 'MP', 'HJ', 'CO', 'BTN', 'SB', 'BB'].map((position) => (
            <TouchableOpacity
              key={position}
              style={styles.quickButton}
              onPress={() => onQuickInsert(position + ' ')}
            >
              <Text style={styles.quickButtonText}>{position}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonCategory}>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.quickButton, styles.actionButton]}
            onPress={() => onQuickInsert('Raise ')}
          >
            <Text style={[styles.quickButtonText, styles.actionButtonText]}>Raise</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickButton, styles.actionButton]}
            onPress={() => onQuickInsert('All-In ')}
          >
            <Text style={[styles.quickButtonText, styles.actionButtonText]}>All-In</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickButton, styles.actionButton]}
            onPress={() => onQuickInsert('Fold ')}
          >
            <Text style={[styles.quickButtonText, styles.actionButtonText]}>Fold</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickButton, styles.actionButton]}
            onPress={() => onQuickInsert('Bet ')}
          >
            <Text style={[styles.quickButtonText, styles.actionButtonText]}>Bet</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickButton, styles.actionButton]}
            onPress={() => onQuickInsert('Call ')}
          >
            <Text style={[styles.quickButtonText, styles.actionButtonText]}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickButton, styles.actionButton]}
            onPress={() => onQuickInsert('Check ')}
          >
            <Text style={[styles.quickButtonText, styles.actionButtonText]}>Check</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Percentage Buttons */}
      <View style={styles.buttonCategory}>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.quickButton}
            onPress={() => onQuickInsert('straddle ')}
          >
            <Text style={styles.quickButtonText}>str</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickButton}
            onPress={() => onQuickInsert('Limp ')}
          >
            <Text style={styles.quickButtonText}>Limp</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickButton}
            onPress={() => onQuickInsert('$')}
          >
            <Text style={styles.quickButtonText}>$</Text>
          </TouchableOpacity>
          {['1', '2', '3'].map((number) => (
            <TouchableOpacity
              key={number}
              style={[styles.quickButton, styles.numberButton]}
              onPress={() => onQuickInsert(number)}
            >
              <Text style={styles.quickButtonText}>{number}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[styles.quickButton, styles.numberButton]}
            onPress={() => onQuickInsert('0')}
          >
            <Text style={styles.quickButtonText}>0</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Number Buttons */}
      <View style={styles.buttonCategory}>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.quickButton}
            onPress={() => onQuickInsert('Pot: ')}
          >
            <Text style={styles.quickButtonText}>Pot</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickButton}
            onPress={() => onQuickInsert('/')}
          >
            <Text style={styles.quickButtonText}>/</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickButton}
            onPress={() => onQuickInsert('x')}
          >
            <Text style={styles.quickButtonText}>x</Text>
          </TouchableOpacity>
          {['4', '5', '6'].map((number) => (
            <TouchableOpacity
              key={number}
              style={[styles.quickButton, styles.numberButton]}
              onPress={() => onQuickInsert(number)}
            >
              <Text style={styles.quickButtonText}>{number}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[styles.quickButton, styles.deleteButton]}
            onPress={onQuickDelete}
            onPressIn={onDeletePressIn}
            onPressOut={onDeletePressOut}
          >
            <Text style={[styles.quickButtonText, styles.deleteButtonText]}>←</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.buttonRow}>
          {[',', ' '].map((symbol) => (
            <TouchableOpacity
              key={symbol}
              style={styles.quickButton}
              onPress={() => onQuickInsert(symbol)}
            >
              <Text style={styles.quickButtonText}>
                {symbol === ' ' ? '␣' : symbol}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={styles.quickButton}
            onPress={() => onQuickInsert('.')}
          >
            <Text style={styles.quickButtonText}>.</Text>
          </TouchableOpacity>
          {['7', '8', '9'].map((number) => (
            <TouchableOpacity
              key={number}
              style={[styles.quickButton, styles.numberButton]}
              onPress={() => onQuickInsert(number)}
            >
              <Text style={styles.quickButtonText}>{number}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[styles.quickButton, styles.wideButton, styles.enterButton]}
            onPress={() => onQuickInsert('\n')}
          >
            <Text style={[styles.quickButtonText, styles.enterButtonText]}>↵</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  quickButtonsSection: {
    backgroundColor: 'transparent',
    borderRadius: theme.radius.card,
    padding: theme.spacing.sm,
    marginTop: theme.spacing.xs,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  buttonCategory: {
    marginBottom: theme.spacing.xs,
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Math.max(theme.spacing.xs, 6),
  },
  quickButton: {
    backgroundColor: theme.colors.inputBg,
    borderRadius: theme.radius.button,
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderWidth: 1,
    borderColor: theme.colors.border || theme.colors.gray,
    flex: 1,
    minWidth: Math.max(Dimensions.get('window').width * 0.09, 36),
    maxWidth: Dimensions.get('window').width * 0.16,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2,
  },
  quickButtonText: {
    fontSize: Math.min(theme.font.size.small, 10),
    color: '#000000',
    fontWeight: '700',
    textAlign: 'center',
  },
  actionButton: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  roundButton: {
    backgroundColor: theme.colors.profit,
    borderColor: theme.colors.profit,
    minWidth: Math.max(Dimensions.get('window').width * 0.07, 28),
    maxWidth: Dimensions.get('window').width * 0.10,
    paddingHorizontal: 0,
    height: 32,
  },
  compactButton: {
    minWidth: Math.max(Dimensions.get('window').width * 0.11, 44),
    paddingHorizontal: theme.spacing.xs,
  },
  roundButtonText: {
    color: '#000000',
    fontWeight: '700',
    fontSize: Math.min(theme.font.size.small, 11),
  },
  deleteButton: {
    backgroundColor: theme.colors.loss,
    borderColor: theme.colors.loss,
  },
  deleteButtonText: {
    color: '#000000',
    fontWeight: '700',
  },
  numberButton: {
    backgroundColor: '#A7F3D0', // 淡綠色
    borderColor: '#6EE7B7',
  },
  enterButton: {
    backgroundColor: '#BFDBFE', // 淡藍色
    borderColor: '#93C5FD',
  },
  enterButtonText: {
    color: '#000000',
    fontWeight: '700',
    fontSize: theme.font.size.body,
  },
  wideButton: {
    minWidth: Math.max(Dimensions.get('window').width * 0.09, 36), // 與一般按鈕相同大小
    paddingHorizontal: 0,
  },
}); 