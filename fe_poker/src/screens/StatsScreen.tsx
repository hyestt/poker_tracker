import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSessionStore } from '../viewmodels/sessionStore';
import { theme } from '../theme';
import { Card } from '../components/Card';

export const StatsScreen: React.FC = () => {
  const { stats, fetchStats } = useSessionStore();

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>統計數據</Text>
      <Card>
        <Text style={styles.statTitle}>總盈虧</Text>
        <Text style={[styles.statValue, {color: stats.totalProfit >= 0 ? theme.colors.profit : theme.colors.loss}]}>${stats.totalProfit}</Text>
        <Text style={styles.statSub}>場次：{stats.totalSessions}｜勝率：{stats.winRate}%｜平均場次：${stats.avgSession}</Text>
      </Card>
      <Card>
        <Text style={styles.statTitle}>分盲注</Text>
        {Object.entries(stats.byStakes).map(([stake, value]) => (
          <View key={stake} style={styles.row}>
            <Text style={styles.label}>{stake}</Text>
            <Text style={[styles.value, {color: value >= 0 ? theme.colors.profit : theme.colors.loss}]}>{value >= 0 ? '+' : ''}{value}</Text>
          </View>
        ))}
      </Card>
      <Card>
        <Text style={styles.statTitle}>分場地</Text>
        {Object.entries(stats.byLocation).map(([loc, value]) => (
          <View key={loc} style={styles.row}>
            <Text style={styles.label}>{loc}</Text>
            <Text style={[styles.value, {color: value >= 0 ? theme.colors.profit : theme.colors.loss}]}>{value >= 0 ? '+' : ''}{value}</Text>
          </View>
        ))}
      </Card>
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
  statTitle: {
    fontSize: theme.font.size.subtitle,
    fontWeight: '700',
    marginBottom: theme.spacing.sm,
    color: theme.colors.text,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: theme.spacing.xs,
  },
  statSub: {
    color: theme.colors.gray,
    fontSize: theme.font.size.small,
    marginBottom: theme.spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  label: {
    color: theme.colors.text,
    fontSize: theme.font.size.body,
  },
  value: {
    fontWeight: 'bold',
    fontSize: theme.font.size.body,
  },
}); 