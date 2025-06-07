import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useSessionStore } from '../viewmodels/sessionStore';
import { theme } from '../theme';
import { Button } from '../components/Button';
import { Card } from '../components/Card';

export const HomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { stats, sessions, hands, fetchSessions, fetchHands, fetchStats, deleteHand, analyzeHand } = useSessionStore();
  const recentHands = hands.slice(-5).reverse();
  
  // 計算有實際手牌記錄的 sessions 數量
  const activeSessions = sessions.filter(session => 
    hands.some(hand => hand.sessionId === session.id)
  );

  useEffect(() => {
    fetchSessions();
    fetchHands();
    fetchStats();
  }, []);

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

  const handleAnalyze = async (id: string) => {
    try {
      const analysis = await analyzeHand(id);
      Alert.alert("AI Analysis Result", analysis, [{ text: "OK" }]);
    } catch (error) {
      Alert.alert("Analysis Failed", error instanceof Error ? error.message : "Unknown error");
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Poker Tracker</Text>
      <Card style={styles.summaryCard}>
        <Text style={styles.summaryText}>${stats.totalProfit}</Text>
        <Text style={styles.subText}>Total Profit/Loss</Text>
        <Text style={styles.sessionText}>{activeSessions.length} Sessions</Text>
      </Card>
      
      <View style={styles.buttonContainer}>
        <Button title="+ New Hand" onPress={() => navigation.navigate('NewSession')} />
        <Button title="View History" onPress={() => navigation.navigate('History')} style={{backgroundColor: theme.colors.card}} textStyle={{color: theme.colors.primary}} />
      </View>
      
      <Text style={styles.sectionTitle}>Recent Activity</Text>
      {recentHands.length === 0 && <Text style={styles.empty}>No records yet</Text>}
      {recentHands.map((hand, idx) => (
        <Card key={hand.id}>
          <View style={styles.handRow}>
            <View style={styles.handInfo}>
              <Text style={{color: hand.result >= 0 ? theme.colors.profit : theme.colors.loss, fontWeight: 'bold'}}>
                {hand.result >= 0 ? '+' : ''}{hand.result}
              </Text>
              <Text style={styles.handDetail}>{hand.details}</Text>
              {hand.analysis && (
                <Text style={styles.analysisIndicator}>✨ Analyzed</Text>
              )}
            </View>
            <View style={styles.buttonGroup}>
              <TouchableOpacity onPress={() => handleAnalyze(hand.id)} style={styles.analyzeButton}>
                <Text style={styles.analyzeButtonText}>AI Analysis</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(hand.id)} style={styles.deleteButton}>
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
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
  buttonContainer: {
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: theme.font.size.subtitle,
    fontWeight: '700',
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
  handRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  handInfo: {
    flex: 1,
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
  analysisIndicator: {
    color: theme.colors.primary,
    fontSize: theme.font.size.small,
    marginTop: theme.spacing.xs,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  analyzeButton: {
    padding: theme.spacing.xs,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.button,
    minWidth: 80,
    alignItems: 'center',
  },
  analyzeButtonText: {
    color: '#fff',
    fontSize: theme.font.size.small,
    fontWeight: 'bold',
  },
}); 