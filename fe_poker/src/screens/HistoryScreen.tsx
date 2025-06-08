import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useSessionStore } from '../viewmodels/sessionStore';
import { theme } from '../theme';
import { Card } from '../components/Card';

const sortOptions = [
  { key: 'date', label: 'Date' },
  { key: 'amount', label: 'Amount' },
  { key: 'location', label: 'Location' },
];

export const HistoryScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { hands, sessions, fetchHands, fetchSessions, deleteHand } = useSessionStore();
  const [sortKey, setSortKey] = useState('date');

  useEffect(() => {
    fetchHands();
    fetchSessions();
  }, []);

  const getSession = (id: string) => sessions.find(s => s.id === id);

  const handleDelete = (id: string) => {
    Alert.alert(
      "Delete Record",
      "Are you sure you want to delete this hand record?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { text: "Delete", onPress: () => deleteHand(id) }
      ]
    );
  };

  const sortedHands = [...hands].sort((a, b) => {
    if (sortKey === 'date') return b.date.localeCompare(a.date);
    if (sortKey === 'amount') return b.result - a.result;
    if (sortKey === 'location') {
      const locA = getSession(a.sessionId)?.location || '';
      const locB = getSession(b.sessionId)?.location || '';
      return locA.localeCompare(locB);
    }
    return 0;
  });

  return (
    <View style={styles.container}>
      <View style={styles.sortRow}>
        {sortOptions.map(opt => (
          <TouchableOpacity key={opt.key} onPress={() => setSortKey(opt.key)} style={[styles.sortBtn, sortKey === opt.key && styles.activeSortBtn]}>
            <Text style={[styles.sortText, sortKey === opt.key && styles.activeSortText]}>{opt.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <ScrollView>
        {sortedHands.length === 0 && <Text style={styles.empty}>No records yet</Text>}
        {sortedHands.map(hand => {
          const session = getSession(hand.sessionId);
          return (
            <Card key={hand.id}>
              <View style={styles.row}>
                <Text style={{color: hand.result >= 0 ? theme.colors.profit : theme.colors.loss, fontWeight: 'bold', fontSize: theme.font.size.body}}>
                  {hand.result >= 0 ? '+' : ''}{hand.result}
                </Text>
                <Text style={styles.date}>{session?.location} / {hand.date.slice(0, 16)}</Text>
              </View>
              <Text style={styles.detail}>{hand.details}</Text>
              <View style={styles.buttonGroup}>
                <TouchableOpacity onPress={() => navigation.navigate('EditHand', { handId: hand.id })} style={styles.editButton}>
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(hand.id)} style={styles.deleteButton}>
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </Card>
          );
        })}
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
  sortRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing.sm,
    justifyContent: 'center',
  },
  sortBtn: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.button,
    backgroundColor: theme.colors.inputBg,
    marginHorizontal: theme.spacing.xs,
  },
  activeSortBtn: {
    backgroundColor: theme.colors.primary,
  },
  sortText: {
    color: theme.colors.text,
    fontSize: theme.font.size.body,
  },
  activeSortText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    color: theme.colors.gray,
    fontSize: theme.font.size.small,
  },
  detail: {
    color: theme.colors.text,
    fontSize: theme.font.size.body,
    marginTop: theme.spacing.xs,
  },
  empty: {
    color: theme.colors.gray,
    textAlign: 'center',
    marginVertical: theme.spacing.md,
  },
  deleteButton: {
    padding: theme.spacing.xs,
    backgroundColor: theme.colors.loss,
    borderRadius: theme.radius.button,
    minWidth: 60,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: theme.font.size.small,
    fontWeight: 'bold',
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.sm,
  },
  editButton: {
    padding: theme.spacing.xs,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.button,
    minWidth: 60,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  editButtonText: {
    color: theme.colors.primary,
    fontSize: theme.font.size.small,
    fontWeight: 'bold',
  },
}); 