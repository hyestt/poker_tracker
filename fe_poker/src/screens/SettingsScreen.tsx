import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { theme } from '../theme';
import { DatabaseService } from '../services/DatabaseService';
import { useSessionStore } from '../viewmodels/sessionStore';
import RevenueCatService from '../services/RevenueCatService';
import { PurchasesOffering, PurchasesPackage } from 'react-native-purchases';

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
  const [offerings, setOfferings] = useState<PurchasesOffering[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkSubscription = async () => {
      try {
        setIsLoading(true);
        const premiumStatus = await RevenueCatService.isPremiumUser();
        setIsPremium(premiumStatus);
        
        if (!premiumStatus) {
          const availableOfferings = await RevenueCatService.getOfferings();
          setOfferings(availableOfferings);
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to fetch subscription status.');
        console.error("Failed to fetch subscription status:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSubscription();
  }, []);

  const handlePurchase = async (pkg: PurchasesPackage) => {
    try {
      setIsLoading(true);
      await RevenueCatService.purchasePackage(pkg);
      const customerInfo = await RevenueCatService.getCustomerInfo();
      if (customerInfo.entitlements.active.pro) {
        setIsPremium(true);
        Alert.alert('Success', 'You are now a PRO member!');
      }
    } catch (e: any) {
      if (!e.userCancelled) {
        Alert.alert('Purchase Error', e.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestorePurchases = async () => {
    try {
      setIsLoading(true);
      const customerInfo = await RevenueCatService.restorePurchases();
      if (customerInfo.entitlements.active.pro) {
        setIsPremium(true);
        Alert.alert('Success', 'Your purchases have been restored.');
      } else {
        Alert.alert('Info', 'No active subscriptions found to restore.');
      }
    } catch (e: any) {
      Alert.alert('Restore Error', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMenuPress = (item: string) => {
    Alert.alert('Feature in Development', `${item} feature coming soon`);
  };

  const handleDatabaseTest = async () => {
    try {
      // Initialize database
      await DatabaseService.initialize();
      
      // Get data statistics
      const stats = await DatabaseService.getDataStats();
      
      // Get some sample data
      const sessions = await DatabaseService.getAllSessions();
      const hands = await DatabaseService.getAllHands();
      
      const message = `📊 SQLite Database Status:

📈 Statistics:
• Sessions: ${stats.sessionsCount}
• Hands: ${stats.handsCount}

📋 Recent Sessions (first 3):
${sessions.slice(0, 3).map(s => `• ${s.location} - ${s.date}`).join('\n')}

🃏 Recent Hands (first 3):
${hands.slice(0, 3).map(h => `• ${h.holeCards || 'Unknown'} - $${h.result}`).join('\n')}

🔧 Current Mode: ${isLocalMode ? 'Local SQLite' : 'API Mode'}`;
      
      Alert.alert('SQLite Database Test', message);
    } catch (error) {
      Alert.alert('Error', `Database test failed: ${error}`);
    }
  };

  const handleMigrateToLocal = async () => {
    Alert.alert(
      'Migrate Data to Local',
      'This will fetch all data from the backend API and store it in the local SQLite database. Do you want to continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start Migration',
          onPress: async () => {
            try {
              Alert.alert('Migrating', 'Migrating data, please wait...');
              await migrateToLocal();
              Alert.alert('Success', 'Data migration completed! Now using local SQLite storage.');
            } catch (error) {
              Alert.alert('Error', `Migration failed: ${error}`);
            }
          }
        }
      ]
    );
  };

  const handleSwitchMode = async () => {
    const newMode = isLocalMode ? 'API Mode' : 'Local Mode';
    const currentMode = isLocalMode ? 'Local Mode' : 'API Mode';
    
    Alert.alert(
      'Switch Storage Mode',
      `Current Mode: ${currentMode}\nSwitch to: ${newMode}\n\nAre you sure you want to switch?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Switch',
          onPress: async () => {
            try {
              if (isLocalMode) {
                await switchToApiMode();
                Alert.alert('Success', 'Switched to API mode');
              } else {
                await switchToLocalMode();
                Alert.alert('Success', 'Switched to local mode');
              }
            } catch (error) {
              Alert.alert('Error', `Switch failed: ${error}`);
            }
          }
        }
      ]
    );
  };

  const handleRefreshData = async () => {
    try {
      Alert.alert('Refreshing', 'Reloading data...');
      await Promise.all([
        fetchSessions(),
        fetchHands(),
        fetchStats()
      ]);
      Alert.alert('Success', 'Data refreshed');
    } catch (error) {
      Alert.alert('Error', `Refresh failed: ${error}`);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
        
        {/* Subscription Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💎 Upgrade to PRO</Text>
          {isLoading ? (
            <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginVertical: 20 }}/>
          ) : isPremium ? (
            <View style={styles.menuItem}>
              <Text style={styles.menuText}>🎉 You are a PRO member</Text>
            </View>
          ) : (
            <>
              {offerings.map((offering) => 
                offering.availablePackages.map((pkg) => (
                  <TouchableOpacity key={pkg.identifier} style={styles.menuItem} onPress={() => handlePurchase(pkg)}>
                    <Text style={styles.menuText}>{`${pkg.product.title} - ${pkg.product.priceString}`}</Text>
                    <Text style={styles.menuArrow}>›</Text>
                  </TouchableOpacity>
                ))
              )}
              <TouchableOpacity style={styles.menuItem} onPress={handleRestorePurchases}>
                <Text style={styles.menuText}>🔄 Restore Purchases</Text>
                <Text style={styles.menuArrow}>›</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Data Management Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Data Management</Text>
          
          <TouchableOpacity style={styles.menuItem} onPress={handleDatabaseTest}>
            <Text style={styles.menuText}>🔍 SQLite Database Test</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleMigrateToLocal}>
            <Text style={styles.menuText}>🚀 Migrate Data to Local</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleSwitchMode}>
            <Text style={styles.menuText}>
              🔄 Switch Storage Mode ({isLocalMode ? 'Local' : 'API'})
            </Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleRefreshData}>
            <Text style={styles.menuText}>🔄 Refresh Data</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* App Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚙️ App Settings</Text>
          
          <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuPress('Notifications')}>
            <Text style={styles.menuText}>🔔 Notification Settings</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuPress('Privacy')}>
            <Text style={styles.menuText}>🔒 Privacy Settings</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuPress('Backup')}>
            <Text style={styles.menuText}>💾 Backup & Sync</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🛠️ Support</Text>
          
          <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuPress('Help')}>
            <Text style={styles.menuText}>❓ Help Center</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuPress('Contact')}>
            <Text style={styles.menuText}>📧 Contact Us</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuPress('About')}>
            <Text style={styles.menuText}>ℹ️ About App</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Status Information */}
        <View style={styles.statusSection}>
          <Text style={styles.statusTitle}>📱 System Status</Text>
          <Text style={styles.statusText}>Storage Mode: {isLocalMode ? 'Local SQLite' : 'API Mode'}</Text>
          <Text style={styles.statusText}>Version: 1.0.0</Text>
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
    fontSize: 18,
    color: theme.colors.gray,
  },
  statusSection: {
    margin: 16,
    padding: 16,
    backgroundColor: theme.colors.lightGray,
    borderRadius: 12,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 14,
    color: theme.colors.gray,
    marginBottom: 4,
  },
}); 