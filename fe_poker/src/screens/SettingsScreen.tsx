import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { theme } from '../theme';
import { DatabaseService } from '../services/DatabaseService';
import { useSessionStore } from '../viewmodels/sessionStore';
import revenueCatService from '../services/RevenueCatService';

export const SettingsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { 
    isLocalMode, 
    switchToLocalMode, 
    switchToApiMode, 
    migrateToLocal,
    fetchSessions,
    fetchHands,
    fetchStats 
  } = useSessionStore();

  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAndCheckStatus = async () => {
      try {
        await revenueCatService.initialize();
        const premiumStatus = await revenueCatService.isPremiumUser();
        setIsPremium(premiumStatus);
      } catch (error) {
        console.error("Failed to check premium status:", error);
        Alert.alert("錯誤", "無法檢查會員狀態。");
      } finally {
        setIsLoading(false);
      }
    };

    initializeAndCheckStatus();
  }, []);

  const handleMenuPress = (item: string) => {
    Alert.alert('Feature in Development', `${item} feature coming soon`);
  };

  const handleDatabaseTest = async () => {
    try {
      // 初始化資料庫
      await DatabaseService.initialize();
      
      // 獲取資料統計
      const stats = await DatabaseService.getDataStats();
      
      // 獲取一些樣本資料
      const sessions = await DatabaseService.getAllSessions();
      const hands = await DatabaseService.getAllHands();
      
      const message = `📊 SQLite 資料庫狀態：

📈 統計資料：
• Sessions: ${stats.sessionsCount}
• Hands: ${stats.handsCount}

📋 最近的 Sessions (前3個)：
${sessions.slice(0, 3).map(s => `• ${s.location} - ${s.date}`).join('\n')}

🃏 最近的 Hands (前3個)：
${hands.slice(0, 3).map(h => `• ${h.holeCards || 'Unknown'} - $${h.result}`).join('\n')}

🔧 當前模式: ${isLocalMode ? '本地 SQLite' : 'API 模式'}`;
      
      Alert.alert('SQLite 資料庫測試', message);
    } catch (error) {
      Alert.alert('錯誤', `資料庫測試失敗: ${error}`);
    }
  };

  const handleMigrateToLocal = async () => {
    Alert.alert(
      '遷移資料到本地',
      '這將從後端 API 獲取所有資料並存儲到本地 SQLite 資料庫。確定要繼續嗎？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '開始遷移',
          onPress: async () => {
            try {
              Alert.alert('遷移中', '正在遷移資料，請稍候...');
              await migrateToLocal();
              Alert.alert('成功', '資料遷移完成！現在使用本地 SQLite 存儲。');
            } catch (error) {
              Alert.alert('錯誤', `遷移失敗: ${error}`);
            }
          }
        }
      ]
    );
  };

  const handleSwitchMode = async () => {
    const newMode = isLocalMode ? 'API 模式' : '本地模式';
    const currentMode = isLocalMode ? '本地模式' : 'API 模式';
    
    Alert.alert(
      '切換存儲模式',
      `當前模式: ${currentMode}\n要切換到: ${newMode}\n\n確定要切換嗎？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '切換',
          onPress: async () => {
            try {
              if (isLocalMode) {
                await switchToApiMode();
                Alert.alert('成功', '已切換到 API 模式');
              } else {
                await switchToLocalMode();
                Alert.alert('成功', '已切換到本地模式');
              }
            } catch (error) {
              Alert.alert('錯誤', `切換失敗: ${error}`);
            }
          }
        }
      ]
    );
  };

  const handleRefreshData = async () => {
    try {
      Alert.alert('刷新中', '正在重新載入資料...');
      await Promise.all([
        fetchSessions(),
        fetchHands(),
        fetchStats()
      ]);
      Alert.alert('成功', '資料已刷新');
    } catch (error) {
      Alert.alert('錯誤', `刷新失敗: ${error}`);
    }
  };

  const handleRestorePurchases = async () => {
    setIsLoading(true);
    try {
      const customerInfo = await revenueCatService.restorePurchases();
      if (customerInfo.entitlements.active && Object.keys(customerInfo.entitlements.active).length > 0) {
        setIsPremium(true);
        Alert.alert("成功", "您的購買已成功恢復！");
      } else {
        Alert.alert("提示", "未找到有效的購買紀錄。");
      }
    } catch (error) {
      Alert.alert("錯誤", "恢復購買失敗，請稍後再試。");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
        
        {/* 會員資格區段 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💎 會員資格</Text>
          
          <View style={styles.menuItem}>
            <Text style={styles.menuText}>當前狀態</Text>
            {isLoading ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : (
              <Text style={[styles.statusTag, isPremium ? styles.premiumTag : styles.freeTag]}>
                {isPremium ? '高級會員' : '免費會員'}
              </Text>
            )}
          </View>

          {!isPremium && (
             <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Subscription')}>
                <Text style={styles.menuText}>🚀 升級到高級版</Text>
                <Text style={styles.menuArrow}>›</Text>
             </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.menuItem} onPress={handleRestorePurchases}>
            <Text style={styles.menuText}>🔄 恢復購買</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* 資料管理區段 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 資料管理</Text>
          
          <TouchableOpacity style={styles.menuItem} onPress={handleDatabaseTest}>
            <Text style={styles.menuText}>🔍 SQLite 資料庫測試</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleMigrateToLocal}>
            <Text style={styles.menuText}>🚀 遷移資料到本地</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleSwitchMode}>
            <Text style={styles.menuText}>
              🔄 切換存儲模式 ({isLocalMode ? '本地' : 'API'})
            </Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleRefreshData}>
            <Text style={styles.menuText}>🔄 刷新資料</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* 應用設定區段 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚙️ 應用設定</Text>
          
          <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuPress('Notifications')}>
            <Text style={styles.menuText}>🔔 通知設定</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuPress('Privacy')}>
            <Text style={styles.menuText}>🔒 隱私設定</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuPress('Backup')}>
            <Text style={styles.menuText}>💾 備份與同步</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* 支援區段 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🛠️ 支援</Text>
          
          <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuPress('Help')}>
            <Text style={styles.menuText}>❓ 幫助中心</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuPress('Contact')}>
            <Text style={styles.menuText}>📧 聯絡我們</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuPress('About')}>
            <Text style={styles.menuText}>ℹ️ 關於應用</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* 狀態資訊 */}
        <View style={styles.statusSection}>
          <Text style={styles.statusTitle}>📱 系統狀態</Text>
          <Text style={styles.statusText}>存儲模式: {isLocalMode ? '本地 SQLite' : 'API 模式'}</Text>
          <Text style={styles.statusText}>版本: 1.0.0</Text>
        </View>

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
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: 100,
  },
  section: {
    marginTop: 20,
    marginHorizontal: 16,
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    padding: 16,
    backgroundColor: theme.colors.lightGray,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  menuText: {
    fontSize: 16,
    color: theme.colors.text,
  },
  menuArrow: {
    fontSize: 20,
    color: theme.colors.lightGray,
  },
  statusSection: {
    marginTop: 30,
    padding: 16,
    alignItems: 'center',
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 14,
    color: theme.colors.textMuted,
    marginBottom: 4,
  },
  statusTag: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    overflow: 'hidden',
    fontSize: 14,
    fontWeight: '600',
  },
  premiumTag: {
    backgroundColor: 'gold',
    color: theme.colors.text,
  },
  freeTag: {
    backgroundColor: theme.colors.lightGray,
    color: theme.colors.textMuted,
  }
}); 