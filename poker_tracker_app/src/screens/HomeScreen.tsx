import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSessionStore } from '../viewmodels/sessionStore';
import { theme } from '../theme';
import { Button } from '../components/Button';
import { Card } from '../components/Card';

export const HomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { stats, sessions, hands, fetchSessions, fetchHands, fetchStats } = useSessionStore();
  const recentHands = hands.slice(-5).reverse();

  useEffect(() => {
    fetchSessions();
    fetchHands();
    fetchStats();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Poker Tracker</Text>
      <Card style={styles.summaryCard}>
        <Text style={styles.summaryText}>${stats.totalProfit}</Text>
        <Text style={styles.subText}>Total Profit/Loss</Text>
        <Text style={styles.sessionText}>{stats.totalSessions} Sessions</Text>
      </Card>
      <Button title="+ New Hand" onPress={() => navigation.navigate('NewSession')} />
      <Button title="View History" onPress={() => navigation.navigate('History')} style={{backgroundColor: theme.colors.card}} textStyle={{color: theme.colors.primary}} />
      <Text style={styles.sectionTitle}>Recent Activity</Text>
      {recentHands.length === 0 && <Text style={styles.empty}>No records yet</Text>}
      {recentHands.map((hand, idx) => (
        <Card key={hand.id}>
          <Text style={{color: hand.result >= 0 ? theme.colors.profit : theme.colors.loss, fontWeight: 'bold'}}>
            {hand.result >= 0 ? '+' : ''}{hand.result}
          </Text>
          <Text style={styles.handDetail}>{hand.details}</Text>
        </Card>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
  },
  title: {
    fontSize: theme.font.size.title,
    fontWeight: '700',
    marginBottom: theme.spacing.md,
    color: theme.colors.primary,
    textAlign: 'center',
  },
  summaryCard: {
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  summaryText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.profit,
  },
  subText: {
    color: theme.colors.gray,
    fontSize: theme.font.size.body,
  },
  sessionText: {
    color: theme.colors.text,
    fontSize: theme.font.size.body,
    marginTop: theme.spacing.xs,
  },
  sectionTitle: {
    fontSize: theme.font.size.subtitle,
    fontWeight: '700',
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    color: theme.colors.text,
  },
  handDetail: {
    color: theme.colors.text,
    fontSize: theme.font.size.body,
    marginTop: theme.spacing.xs,
  },
  empty: {
    color: theme.colors.gray,
    textAlign: 'center',
    marginVertical: theme.spacing.md,
  },
}); 