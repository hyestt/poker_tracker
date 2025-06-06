import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useSessionStore } from '../viewmodels/sessionStore';
import { theme } from '../theme';
import { Card } from '../components/Card';

const sortOptions = [
  { key: 'date', label: '日期' },
  { key: 'amount', label: '金額' },
  { key: 'location', label: '地點' },
];

export const HistoryScreen: React.FC = () => {
  const { hands, sessions, fetchHands, fetchSessions, deleteHand } = useSessionStore();
  const [sortKey, setSortKey] = useState('date');

  useEffect(() => {
    fetchHands();
    fetchSessions();
  }, []);

  const getSession = (id: string) => sessions.find(s => s.id === id);

  const handleDelete = (id: string) => {
    Alert.alert(
      "刪除紀錄",
      "確定要刪除這筆手牌紀錄嗎？",
      [
        {
          text: "取消",
          style: "cancel"
        },
        { text: "確定", onPress: () => deleteHand(id) }
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
        {sortedHands.length === 0 && <Text style={styles.empty}>尚無紀錄</Text>}
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
              <TouchableOpacity onPress={() => handleDelete(hand.id)} style={styles.deleteButton}>
                <Text style={styles.deleteButtonText}>刪除</Text>
              </TouchableOpacity>
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
    marginTop: theme.spacing.sm,
    padding: theme.spacing.xs,
    backgroundColor: theme.colors.loss,
    borderRadius: theme.radius.button,
    alignSelf: 'flex-end',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: theme.font.size.small,
  },
}); 