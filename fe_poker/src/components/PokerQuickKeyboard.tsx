import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { theme } from '../theme';

interface Props {
  onTextInsert: (text: string) => void;
  onClose: () => void;
}

export const PokerQuickKeyboard: React.FC<Props> = ({ onTextInsert, onClose }) => {
  const positions = ['UTG', 'MP', 'HJ', 'CO', 'BTN', 'SB', 'BB'];
  const numbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '.'];
  const rounds = ['PF', 'F', 'T', 'R']; // preflop, flop, turn, river
  const actions = ['Check', 'Bet', 'Raise', 'Call', 'Fold', 'All-IN', 'Straddle'];

  const handleKeyPress = (text: string) => {
    if (text === '換行') {
      onTextInsert('\n');
    } else {
      onTextInsert(text + ' ');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>德州撲克快速鍵盤</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Position Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>位置</Text>
          <View style={styles.buttonGrid}>
            {positions.map((position) => (
              <TouchableOpacity
                key={position}
                style={styles.keyButton}
                onPress={() => handleKeyPress(position)}
              >
                <Text style={styles.keyButtonText}>{position}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Numbers Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>數字</Text>
          <View style={styles.buttonGrid}>
            {numbers.map((number) => (
              <TouchableOpacity
                key={number}
                style={styles.keyButton}
                onPress={() => handleKeyPress(number)}
              >
                <Text style={styles.keyButtonText}>{number}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Betting Rounds Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>投注輪次</Text>
          <View style={styles.buttonGrid}>
            {rounds.map((round) => (
              <TouchableOpacity
                key={round}
                style={styles.keyButton}
                onPress={() => handleKeyPress(round)}
              >
                <Text style={styles.keyButtonText}>{round}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Actions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>動作</Text>
          <View style={styles.buttonGrid}>
            {actions.map((action) => (
              <TouchableOpacity
                key={action}
                style={[styles.keyButton, styles.actionButton]}
                onPress={() => handleKeyPress(action)}
              >
                <Text style={[styles.keyButtonText, styles.actionButtonText]}>{action}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Special Keys Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>特殊按鍵</Text>
          <View style={styles.buttonGrid}>
            <TouchableOpacity
              style={[styles.keyButton, styles.specialButton]}
              onPress={() => handleKeyPress('換行')}
            >
              <Text style={[styles.keyButtonText, styles.specialButtonText]}>換行</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
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
  title: {
    fontSize: theme.font.size.subtitle,
    fontWeight: '700',
    color: theme.colors.text,
  },
  closeButton: {
    padding: theme.spacing.xs,
    borderRadius: theme.radius.button,
    backgroundColor: theme.colors.inputBg,
  },
  closeButtonText: {
    fontSize: 18,
    color: theme.colors.text,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
    padding: theme.spacing.md,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.font.size.body,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  keyButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.radius.button,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minWidth: 50,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  actionButton: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  specialButton: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
    minWidth: 80,
  },
  keyButtonText: {
    fontSize: theme.font.size.body,
    fontWeight: '600',
    color: theme.colors.text,
  },
  actionButtonText: {
    color: '#FFFFFF',
  },
  specialButtonText: {
    color: '#FFFFFF',
  },
}); 