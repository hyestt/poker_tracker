import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Linking, Modal } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { theme } from '../theme';
import { DatabaseService } from '../services/DatabaseService';
import { useSessionStore } from '../viewmodels/sessionStore';
import revenueCatService from '../services/RevenueCatService';
import { PurchasesOffering, PurchasesPackage } from 'react-native-purchases';
import { initConnection, getProducts, endConnection } from 'react-native-iap';
import { UserPreferencesService } from '../services/UserPreferences';
import { createTestHands } from '../utils/createTestHands';
import { WelcomeDemoService } from '../services/WelcomeDemoService';

export const SettingsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  console.log('⚙️ [SettingsScreen] Component mounted');
  const {
    isLocalMode,
    switchToLocalMode,
    switchToApiMode,
    migrateToLocal,
    fetchSessions,
    fetchHands,
    fetchStats,
  } = useSessionStore();
  console.log('⚙️ [SettingsScreen] Current mode - isLocalMode:', isLocalMode);

  const [isPremium, setIsPremium] = useState(false);
  const [offerings, setOfferings] = useState<PurchasesOffering[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTestMode, setIsTestMode] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('English');
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  const languageOptions = [
    { label: 'English', value: 'English' },
    { label: '繁體中文', value: 'Traditional Chinese' },
    { label: '简体中文', value: 'Simplified Chinese' },
    { label: '한국어', value: 'Korean' },
    { label: 'Español', value: 'Spanish' },
    { label: '日本語', value: 'Japanese' },
    { label: 'Français', value: 'French' },
    { label: 'Deutsch', value: 'German' }
  ];

  useEffect(() => {
    const loadUserLanguage = async () => {
      try {
        const preferences = await UserPreferencesService.getPreferences();
        setCurrentLanguage(preferences.language);
      } catch (error) {
        console.error('Failed to load language preference:', error);
      }
    };
    loadUserLanguage();
  }, []);

  useEffect(() => {
    console.log('💎 [SettingsScreen] useEffect - checking subscription status');
    const checkSubscription = async () => {
      try {
        console.log('🔄 [SettingsScreen] Starting subscription check');
        setIsLoading(true);

        // Initialize RevenueCat if needed
        console.log('🔧 [SettingsScreen] Ensuring RevenueCat is initialized');
        await revenueCatService.initialize();

        console.log('💎 [SettingsScreen] Checking premium user status');
        const premiumStatus = await revenueCatService.isPremiumUser();
        console.log('💎 [SettingsScreen] Premium status:', premiumStatus);
        setIsPremium(premiumStatus);

        // 檢查測試模式狀態
        console.log('🧪 [SettingsScreen] Checking test mode status');
        const testStatus = await revenueCatService.getTestPremiumStatus();
        console.log('🧪 [SettingsScreen] Test mode status:', testStatus);
        setIsTestMode(testStatus);

        if (!premiumStatus) {
          console.log('🛍️ [SettingsScreen] User is not premium, fetching offerings');
          const availableOfferings = await revenueCatService.getOfferings();
          console.log('🛍️ [SettingsScreen] Available offerings:', availableOfferings.length);
          setOfferings(availableOfferings);
        } else {
          console.log('✨ [SettingsScreen] User is premium, no need to fetch offerings');
        }
      } catch (error: any) {
        console.error('❌ [SettingsScreen] Failed to fetch subscription status:', {
          message: error.message,
          code: error.code,
          name: error.name,
          stack: error.stack
        });
        
        // 在開發環境或TestFlight測試中，優雅地處理訂閱錯誤
        console.log('🧪 [SettingsScreen] Handling subscription error gracefully for testing');
        console.log('🧪 [SettingsScreen] Error type:', error.constructor.name);
        console.log('🧪 [SettingsScreen] Setting fallback state (non-premium, can toggle test mode)');
        setIsPremium(false);
        setIsTestMode(false);
        
        // 只在非常嚴重的錯誤情況下才顯示錯誤（如網絡完全斷開）
        if (error.message && error.message.includes('network') && !error.message.includes('configuration')) {
          Alert.alert(
            'Network Error', 
            'Please check your internet connection and try again.'
          );
        }
      } finally {
        console.log('🔄 [SettingsScreen] Subscription check completed, setting loading to false');
        setIsLoading(false);
      }
    };

    checkSubscription();
  }, []);

  // 每次進入頁面時檢查訂閱狀態
  useFocusEffect(
    useCallback(() => {
      const refreshSubscriptionStatus = async () => {
        console.log('🔄 [SettingsScreen] useFocusEffect - refreshing subscription status');
        try {
          const premiumStatus = await revenueCatService.isPremiumUser();
          const testStatus = await revenueCatService.getTestPremiumStatus();
          console.log('💎 [SettingsScreen] Focus refresh - Premium:', premiumStatus, 'Test:', testStatus);
          setIsPremium(premiumStatus);
          setIsTestMode(testStatus);
        } catch (error: any) {
          console.error('❌ [SettingsScreen] Failed to refresh subscription status:', {
            message: error.message,
            code: error.code,
            name: error.name
          });
        }
      };
      refreshSubscriptionStatus();
    }, [])
  );

  const handlePurchase = async (pkg: PurchasesPackage) => {
    console.log('🛍️ [SettingsScreen] Purchase initiated for package:', pkg.identifier);
    try {
      setIsLoading(true);
      console.log('💳 [SettingsScreen] Processing purchase...');
      await revenueCatService.purchasePackage(pkg);
      console.log('✅ [SettingsScreen] Purchase completed successfully');
      const customerInfo = await revenueCatService.getCustomerInfo();
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
      const customerInfo = await revenueCatService.restorePurchases();
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

  const handleJoinDiscord = async () => {
    const discordUrl = 'https://discord.gg/MH74zefx';
    try {
      const supported = await Linking.canOpenURL(discordUrl);
      if (supported) {
        await Linking.openURL(discordUrl);
      } else {
        Alert.alert('Error', 'Unable to open Discord link. Please check if Discord is installed or try again later.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open Discord link. Please try again later.');
      console.error('Failed to open Discord link:', error);
    }
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
          },
        },
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
          },
        },
      ]
    );
  };

  const handleRefreshData = async () => {
    try {
      Alert.alert('Refreshing', 'Reloading data...');
      await Promise.all([
        fetchSessions(),
        fetchHands(),
        fetchStats(),
      ]);
      Alert.alert('Success', 'Data refreshed');
    } catch (error) {
      Alert.alert('Error', `Refresh failed: ${error}`);
    }
  };

  const handleToggleTestPremium = async () => {
    try {
      const newStatus = !isTestMode;
      await revenueCatService.setTestPremiumStatus(newStatus);
      setIsTestMode(newStatus);
      setIsPremium(newStatus);

      Alert.alert(
        'Test Mode Updated',
        `Test premium status: ${newStatus ? 'Premium' : 'Free'}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to toggle test status');
      console.error('Failed to toggle test status:', error);
    }
  };

  const handleCreateTestHands = async () => {
    Alert.alert(
      'Create Test Data',
      'This will create 9 test hands to test the 10-hand limit. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create',
          onPress: async () => {
            try {
              await createTestHands();
              await Promise.all([
                fetchSessions(),
                fetchHands(),
                fetchStats(),
              ]);
              Alert.alert(
                'Success',
                '9 test hands created successfully! Try adding one more hand to test the limit.'
              );
            } catch (error) {
              Alert.alert('Error', 'Failed to create test hands: ' + error);
              console.error('Failed to create test hands:', error);
            }
          },
        },
      ]
    );
  };

  const handleResetPreferences = async () => {
    Alert.alert(
      'Reset User Preferences',
      'This will reset all your saved preferences (locations, currencies, etc.) to default values. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await UserPreferencesService.resetToDefaults();
              Alert.alert('Success', 'User preferences have been reset to defaults');
            } catch (error) {
              Alert.alert('Error', `Reset failed: ${error}`);
            }
          },
        },
      ]
    );
  };

  const handleLanguageSelect = async (language: string) => {
    try {
      await UserPreferencesService.updateLanguage(language);
      setCurrentLanguage(language);
      setShowLanguageModal(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to update language setting');
      console.error('Failed to update language:', error);
    }
  };

  const getCurrentLanguageLabel = () => {
    const option = languageOptions.find(opt => opt.value === currentLanguage);
    return option ? option.label : currentLanguage;
  };

  const testRevenueCatOfferings = async () => {
    try {
      setIsLoading(true);
      console.log('🔍 Testing RevenueCat Offerings...');
      
      await revenueCatService.initialize();
      const offerings = await revenueCatService.getOfferings();
      
      console.log('📦 Total offerings:', offerings.length);
      let offeringsDetails = `Found ${offerings.length} offerings:\n\n`;
      
      offerings.forEach((offering, index) => {
        console.log(`📦 Offering ${index}:`, offering.identifier);
        offeringsDetails += `Offering ${index}: ${offering.identifier}\n`;
        
        offering.availablePackages.forEach((pkg, pkgIndex) => {
          const packageInfo = {
            identifier: pkg.identifier,
            title: pkg.product.title,
            price: pkg.product.priceString,
            productId: pkg.product.identifier
          };
          console.log(`  📱 Package ${pkgIndex}:`, packageInfo);
          offeringsDetails += `  Package: ${pkg.identifier}\n  Price: ${pkg.product.priceString}\n\n`;
        });
      });
      
      Alert.alert('RevenueCat Offerings Test', offeringsDetails || 'No offerings found');
    } catch (error: any) {
      console.error('❌ RevenueCat API Error:', error);
      Alert.alert(
        'RevenueCat Error', 
        `Error: ${error.message || 'Unknown error'}\n\nCode: ${error.code || 'N/A'}\nDomain: ${error.domain || 'N/A'}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const testAppStoreProducts = async () => {
    try {
      setIsLoading(true);
      console.log('🍎 Testing App Store Products...');
      
      await initConnection();
      
      const products = await getProducts({
        skus: [
          'com.glen.livehand.pro.annual',
          'com.glen.livehand.pro.monthly'
        ]
      });
      
      console.log('🍎 App Store Products found:', products.length);
      let productsDetails = `Found ${products.length} products:\n\n`;
      
      products.forEach((product: any) => {
        const productInfo = {
          productId: product.productId,
          title: product.title,
          price: product.price,
          currency: product.currency
        };
        console.log(`  📱 Product:`, productInfo);
        productsDetails += `Product: ${product.productId}\nTitle: ${product.title}\nPrice: ${product.price} ${product.currency}\n\n`;
      });
      
      Alert.alert('App Store Products Test', productsDetails || 'No products found');
      await endConnection();
    } catch (error: any) {
      console.error('❌ App Store Error:', error);
      Alert.alert(
        'App Store Error', 
        `Error: ${error.message || 'Unknown error'}\n\nThis might indicate:\n• Products not configured in App Store Connect\n• Sandbox environment issues\n• Network connectivity problems`
      );
      await endConnection();
    } finally {
      setIsLoading(false);
    }
  };

  const runFullDiagnostic = async () => {
    try {
      setIsLoading(true);
      console.log('🔍 Starting Full Diagnostic...');
      
      let diagnosticReport = 'Full Diagnostic Report:\n\n';
      
      // 測試1: RevenueCat初始化
      try {
        console.log('1️⃣ Testing RevenueCat initialization...');
        await revenueCatService.initialize();
        diagnosticReport += '✅ RevenueCat initialization: SUCCESS\n';
      } catch (error: any) {
        diagnosticReport += `❌ RevenueCat initialization: FAILED\n   Error: ${error.message}\n`;
      }
      
      // 測試2: RevenueCat offerings
      let revenueCatProducts: string[] = [];
      try {
        console.log('2️⃣ Testing RevenueCat offerings...');
        const offerings = await revenueCatService.getOfferings();
        revenueCatProducts = offerings
          .flatMap(o => o.availablePackages)
          .map(p => p.identifier);
        diagnosticReport += `✅ RevenueCat offerings: ${offerings.length} found\n`;
        diagnosticReport += `   Products: ${revenueCatProducts.join(', ')}\n`;
      } catch (error: any) {
        diagnosticReport += `❌ RevenueCat offerings: FAILED\n   Error: ${error.message}\n`;
      }
      
      // 測試3: App Store products
      let storeProductIds: string[] = [];
      try {
        console.log('3️⃣ Testing App Store products...');
        await initConnection();
        const storeProducts = await getProducts({
          skus: [
            'com.glen.livehand.pro.annual',
            'com.glen.livehand.pro.monthly'
          ]
        });
        storeProductIds = storeProducts.map((p: any) => p.productId);
        diagnosticReport += `✅ App Store products: ${storeProducts.length} found\n`;
        diagnosticReport += `   Products: ${storeProductIds.join(', ')}\n`;
        await endConnection();
      } catch (error: any) {
        diagnosticReport += `❌ App Store products: FAILED\n   Error: ${error.message}\n`;
        await endConnection();
      }
      
      // 比較結果
      const expectedProducts = ['com.glen.livehand.pro.annual', 'com.glen.livehand.pro.monthly'];
      const revenueCatMatch = expectedProducts.every(p => revenueCatProducts.includes(p));
      const appStoreMatch = expectedProducts.every(p => storeProductIds.includes(p));
      const productsMatch = JSON.stringify(revenueCatProducts.sort()) === JSON.stringify(storeProductIds.sort());
      
      diagnosticReport += '\n📊 Sync Analysis:\n';
      diagnosticReport += `   Expected products match RevenueCat: ${revenueCatMatch ? '✅' : '❌'}\n`;
      diagnosticReport += `   Expected products match App Store: ${appStoreMatch ? '✅' : '❌'}\n`;
      diagnosticReport += `   RevenueCat ↔️ App Store sync: ${productsMatch ? '✅' : '❌'}\n`;
      
      console.log('📊 Diagnostic Results:', {
        revenueCatOfferings: revenueCatProducts.length,
        revenueCatProducts: revenueCatProducts,
        appStoreProducts: storeProductIds,
        productsMatch
      });
      
      Alert.alert('Full Diagnostic Complete', diagnosticReport);
      
    } catch (error: any) {
      console.error('❌ Diagnostic Error:', error);
      Alert.alert('Diagnostic Error', `Unexpected error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateWelcomeDemo = async () => {
    try {
      setIsLoading(true);

      // Check if welcome demo data already exists
      const welcomeDataExists = await WelcomeDemoService.checkIfWelcomeDataExists();

      if (welcomeDataExists) {
        Alert.alert(
          'Demo Session Exists',
          'A welcome demo session already exists. Do you want to recreate it?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Recreate',
              onPress: async () => {
                try {
                  setIsLoading(true);
                  await WelcomeDemoService.recreateWelcomeData();
                  await Promise.all([
                    fetchSessions(),
                    fetchHands(),
                    fetchStats(),
                  ]);
                  Alert.alert('Success', 'Welcome demo session recreated successfully! Check your History to view the demo content.');
                } catch (error) {
                  const errorMessage = error instanceof Error ? error.message : String(error);
                  Alert.alert('Error', `Failed to recreate demo session: ${errorMessage}`);
                  console.error('Failed to recreate welcome demo:', error);
                } finally {
                  setIsLoading(false);
                }
              },
            },
          ]
        );
      } else {
        await WelcomeDemoService.createWelcomeData();
        await Promise.all([
          fetchSessions(),
          fetchHands(),
          fetchStats(),
        ]);
        Alert.alert('Success', 'Welcome demo session created successfully! Check your History to view the demo content.');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      Alert.alert('Error', `Failed to create demo session: ${errorMessage}`);
      console.error('Failed to create welcome demo:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>

        {/* Subscription Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upgrade to PRO</Text>
          {isLoading ? (
            <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginVertical: 20 }}/>
          ) : isPremium ? (
            <View style={styles.menuItem}>
              <Text style={styles.menuText}>You are a PRO member</Text>
            </View>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.menuItem, styles.upgradeMenuItem]}
                onPress={() => navigation.navigate('Subscription')}
              >
                <Text style={[styles.menuText, styles.upgradeMenuText]}>🚀 View Premium Plans</Text>
                <Text style={styles.menuArrow}>›</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem} onPress={handleRestorePurchases}>
                <Text style={styles.menuText}>Restore Purchases</Text>
                <Text style={styles.menuArrow}>›</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* App Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Settings</Text>

          <TouchableOpacity style={styles.menuItem} onPress={() => setShowLanguageModal(true)}>
            <Text style={styles.menuText}>GTO Analysis Language</Text>
            <View style={styles.languageDisplay}>
              <Text style={styles.languageText}>{getCurrentLanguageLabel()}</Text>
              <Text style={styles.menuArrow}>›</Text>
            </View>
          </TouchableOpacity>

        </View>


        {/* Debug Section (Always visible for diagnostics) */}
        {true && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Diagnostics & Testing</Text>

            <TouchableOpacity style={styles.menuItem} onPress={handleToggleTestPremium}>
              <Text style={styles.menuText}>
                Toggle Premium Status (Test Mode)
              </Text>
              <Text style={[styles.menuArrow, { color: isTestMode ? '#27C46A' : '#FF3B30' }]}>
                {isTestMode ? 'Premium' : 'Free'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={handleCreateTestHands}>
              <Text style={styles.menuText}>
                Create 9 Test Hands
              </Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={handleCreateWelcomeDemo}>
              <Text style={styles.menuText}>
                Create Welcome Demo Session
              </Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={testRevenueCatOfferings}>
              <Text style={styles.menuText}>
                Test RevenueCat Offerings
              </Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={testAppStoreProducts}>
              <Text style={styles.menuText}>
                Test App Store Products
              </Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={runFullDiagnostic}>
              <Text style={styles.menuText}>
                Run Full Diagnostic
              </Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>

            <View style={styles.debugInfo}>
              <Text style={styles.debugText}>
                Current Status: {isPremium || isTestMode ? 'Premium' : 'Free'}
                {isTestMode && ' (Test Mode)'}
              </Text>
            </View>
          </View>
        )}

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>

<TouchableOpacity style={styles.menuItem} onPress={handleJoinDiscord}>
            <Text style={styles.menuText}>Contact us on Discord</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>



      </ScrollView>

      {/* Language Selection Modal */}
      <Modal
        visible={showLanguageModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Language</Text>
            
            {languageOptions.map((option, index) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.languageOption,
                  currentLanguage === option.value && styles.selectedLanguageOption,
                  index === languageOptions.length - 1 && { borderBottomWidth: 0 }
                ]}
                onPress={() => handleLanguageSelect(option.value)}
              >
                <Text style={[
                  styles.languageOptionText,
                  currentLanguage === option.value && styles.selectedLanguageOptionText
                ]}>
                  {option.label}
                </Text>
                {currentLanguage === option.value && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowLanguageModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: 60, // 添加頂部間距替代header
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
  upgradeMenuItem: {
    backgroundColor: '#F0F8FF',
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  upgradeMenuText: {
    color: theme.colors.primary,
    fontWeight: '600',
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
  debugInfo: {
    backgroundColor: theme.colors.inputBg,
    padding: theme.spacing.sm,
    borderRadius: theme.radius.input,
    marginTop: theme.spacing.sm,
    marginHorizontal: theme.spacing.md,
  },
  debugText: {
    fontSize: theme.font.size.small,
    color: theme.colors.text,
    textAlign: 'center',
    fontWeight: '500',
  },
  languageDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  languageText: {
    fontSize: 14,
    color: theme.colors.gray,
    marginRight: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    padding: 0,
    margin: 20,
    minWidth: 280,
    maxWidth: 320,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    padding: 20,
    textAlign: 'center',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  selectedLanguageOption: {
    backgroundColor: theme.colors.inputBg,
  },
  languageOptionText: {
    fontSize: 16,
    color: theme.colors.text,
  },
  selectedLanguageOptionText: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  checkmark: {
    fontSize: 18,
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  cancelButton: {
    padding: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  cancelButtonText: {
    fontSize: 16,
    color: theme.colors.gray,
    fontWeight: '500',
  },
});
