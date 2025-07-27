import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { theme } from '../theme';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { DataLoaderService } from '../services/DataLoaderService';
import { DatabaseService } from '../services/DatabaseService';

interface MigrationStats {
  isConsistent: boolean;
  jsonStats: { sessionsCount: number; handsCount: number };
  sqliteStats: { sessionsCount: number; handsCount: number };
}

export const DataMigrationScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [migrationStats, setMigrationStats] = useState<MigrationStats | null>(null);
  const [dataSummary, setDataSummary] = useState<any>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const summary = DataLoaderService.getDataSummary();
      setDataSummary(summary);
      
      const stats = await DataLoaderService.validateDataConsistency();
      setMigrationStats(stats);
    } catch (error) {
      console.error('載入初始數據失敗:', error);
    }
  };

  const handleMigrateData = async () => {
    setLoading(true);
    try {
      await DataLoaderService.loadDataToSQLite();
      
      // 重新檢查一致性
      const stats = await DataLoaderService.validateDataConsistency();
      setMigrationStats(stats);
      
      Alert.alert(
        '遷移成功',
        `已成功遷移 ${stats.sqliteStats.sessionsCount} 個 sessions 和 ${stats.sqliteStats.handsCount} 個 hands 到本地數據庫`,
        [{ text: '確定' }]
      );
    } catch (error) {
      console.error('數據遷移失敗:', error);
      Alert.alert('遷移失敗', '數據遷移過程中發生錯誤，請檢查控制台日誌');
    } finally {
      setLoading(false);
    }
  };

  const handleClearData = async () => {
    Alert.alert(
      '確認清空',
      '確定要清空所有本地數據嗎？此操作不可撤銷。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '確定',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await DatabaseService.initialize();
              await DatabaseService.clearAllData();
              
              const stats = await DataLoaderService.validateDataConsistency();
              setMigrationStats(stats);
              
              Alert.alert('清空成功', '本地數據已清空');
            } catch (error) {
              console.error('清空數據失敗:', error);
              Alert.alert('清空失敗', '清空數據時發生錯誤');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleTestQuery = async () => {
    setLoading(true);
    try {
      const data = await DataLoaderService.getAllDataFromSQLite();
      
      Alert.alert(
        '查詢結果',
        `Sessions: ${data.sessions.length}\nHands: ${data.hands.length}\n\n最新 Session: ${
          data.sessions[0]?.location || '無'
        }\n最新 Hand: ${data.hands[0]?.details?.substring(0, 50) || '無'}...`,
        [{ text: '確定' }]
      );
    } catch (error) {
      console.error('查詢失敗:', error);
      Alert.alert('查詢失敗', '查詢數據時發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← 返回</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>數據遷移</Text>
      </View>

      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
        
        {/* 數據摘要 */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>📊 數據摘要</Text>
          {dataSummary && (
            <View style={styles.statsContainer}>
              <Text style={styles.statText}>Sessions: {dataSummary.sessionsCount}</Text>
              <Text style={styles.statText}>Hands: {dataSummary.handsCount}</Text>
              <Text style={styles.statText}>地點: {dataSummary.locations.join(', ')}</Text>
              <Text style={styles.statText}>貨幣: {dataSummary.currencies.join(', ')}</Text>
              <Text style={styles.statText}>
                遷移時間: {new Date(dataSummary.migrationDate).toLocaleString()}
              </Text>
            </View>
          )}
        </Card>

        {/* 一致性檢查 */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>🔍 數據一致性</Text>
          {migrationStats && (
            <View style={styles.statsContainer}>
              <View style={styles.consistencyRow}>
                <Text style={styles.statLabel}>狀態:</Text>
                <Text style={[
                  styles.consistencyStatus,
                  migrationStats.isConsistent ? styles.consistent : styles.inconsistent
                ]}>
                  {migrationStats.isConsistent ? '✅ 一致' : '❌ 不一致'}
                </Text>
              </View>
              
              <View style={styles.comparisonContainer}>
                <View style={styles.comparisonColumn}>
                  <Text style={styles.comparisonTitle}>JSON 數據</Text>
                  <Text style={styles.statText}>Sessions: {migrationStats.jsonStats.sessionsCount}</Text>
                  <Text style={styles.statText}>Hands: {migrationStats.jsonStats.handsCount}</Text>
                </View>
                
                <View style={styles.comparisonColumn}>
                  <Text style={styles.comparisonTitle}>SQLite 數據</Text>
                  <Text style={styles.statText}>Sessions: {migrationStats.sqliteStats.sessionsCount}</Text>
                  <Text style={styles.statText}>Hands: {migrationStats.sqliteStats.handsCount}</Text>
                </View>
              </View>
            </View>
          )}
        </Card>

        {/* 操作按鈕 */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>🛠 操作</Text>
          
          <Button
            title="遷移數據到 SQLite"
            onPress={handleMigrateData}
            disabled={loading}
            style={styles.actionButton}
          />
          
          <Button
            title="測試查詢數據"
            onPress={handleTestQuery}
            disabled={loading}
            style={styles.actionButton}
          />
          
          <Button
            title="清空本地數據"
            onPress={handleClearData}
            disabled={loading}
            style={styles.actionButton}
          />
        </Card>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>處理中...</Text>
          </View>
        )}

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    marginRight: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: theme.colors.primary,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 12,
  },
  statsContainer: {
    gap: 8,
  },
  statText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  consistencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  consistencyStatus: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  consistent: {
    color: theme.colors.success,
  },
  inconsistent: {
    color: theme.colors.error,
  },
  comparisonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  comparisonColumn: {
    flex: 1,
    marginHorizontal: 8,
  },
  comparisonTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  actionButton: {
    marginBottom: 12,
  },
  secondaryButton: {
    backgroundColor: theme.colors.secondary,
  },
  dangerButton: {
    backgroundColor: theme.colors.error,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
}); 