import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Linking, Modal, Platform } from 'react-native';
import { theme } from '../theme';
import { useSessionStore } from '../viewmodels/sessionStore';
import RevenueCatService from '../services/RevenueCatService';
import { PurchasesOffering } from 'react-native-purchases';
import { UserPreferencesService } from '../services/UserPreferences';
import { createTestHands } from '../utils/createTestHands';
import { WelcomeDemoService } from '../services/WelcomeDemoService';

export const SettingsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  console.log('⚙️ [SettingsScreen] Component mounted');
  const {
    isLocalMode,
    fetchSessions,
    fetchHands,
    fetchStats,
  } = useSessionStore();
  console.log('⚙️ [SettingsScreen] Current mode - isLocalMode:', isLocalMode);

  const [isPremium, setIsPremium] = useState(false);
  const [_offerings, setOfferings] = useState<PurchasesOffering[]>([]);
  const [isLoading, setIsLoading] = useState(false); // 預設不顯示 loading，避免進入頁面閃爍
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
    { label: 'Deutsch', value: 'German' },
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

        // Initialize RevenueCat if needed
        console.log('🔧 [SettingsScreen] Ensuring RevenueCat is initialized');
        await RevenueCatService.initialize();

        console.log('💎 [SettingsScreen] Checking premium user status');
        const premiumStatus = await RevenueCatService.isPremiumUser();
        console.log('💎 [SettingsScreen] Premium status:', premiumStatus);
        setIsPremium(premiumStatus);

        // 檢查測試模式狀態
        console.log('🧪 [SettingsScreen] Checking test mode status');
        const testStatus = await RevenueCatService.getTestPremiumStatus();
        console.log('🧪 [SettingsScreen] Test mode status:', testStatus);
        setIsTestMode(testStatus);

        if (!premiumStatus) {
          console.log('🛍️ [SettingsScreen] User is not premium, fetching offerings');
          const availableOfferings = await RevenueCatService.getOfferings();
          console.log('🛍️ [SettingsScreen] Available offerings:', availableOfferings.length);
          setOfferings(availableOfferings);
        } else {
          console.log('✨ [SettingsScreen] User is premium, no need to fetch offerings');
        }
      } catch (error) {
        console.error('❌ [SettingsScreen] Failed to fetch subscription status:', error);
        // 在开发环境中或RevenueCat未配置时不显示错误弹窗
        if (!__DEV__) {
          Alert.alert('Error', 'Failed to fetch subscription status.');
        }
      } finally {
        console.log('🔄 [SettingsScreen] Subscription check completed');
        setIsLoading(false);
      }
    };

    checkSubscription();
  }, []);

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

  const handleRateUs = async () => {
    try {
      const iosReviewUrl = 'itms-apps://apps.apple.com/app/id6749833754?action=write-review';
      const webFallbackUrl = 'https://apps.apple.com/app/id6749833754?action=write-review';

      const preferredUrl = Platform.OS === 'ios' ? iosReviewUrl : webFallbackUrl;
      const supported = await Linking.canOpenURL(preferredUrl);
      await Linking.openURL(supported ? preferredUrl : webFallbackUrl);
    } catch (error) {
      Alert.alert('Error', 'Unable to open the App Store review page.');
      console.error('Failed to open review link:', error);
    }
  };

  const handleToggleTestPremium = async () => {
    try {
      const newStatus = !isTestMode;
      await RevenueCatService.setTestPremiumStatus(newStatus);
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
          {isPremium ? (
            <View style={styles.menuItem}>
              <Text style={styles.menuText}>You are a PRO member</Text>
            </View>
          ) : (
            <>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navigation.navigate('Subscription')}
              >
                <View style={styles.menuItemLeft}>
                  <Text style={styles.menuText}>Upgrade to Pro</Text>
                </View>
                <View style={styles.menuRight}>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>Save 33%</Text>
                  </View>
                  <Text style={styles.menuArrow}>›</Text>
                </View>
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


        {/* Debug Section (Development Only) */}
        {__DEV__ && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Debug & Testing</Text>

            <TouchableOpacity style={styles.menuItem} onPress={handleToggleTestPremium}>
              <Text style={styles.menuText}>
                Toggle Premium Status (Test Mode)
              </Text>
              <Text style={[styles.menuArrow, isTestMode ? styles.testModeActive : styles.testModeInactive]}>
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

            <View style={styles.debugInfo}>
              <Text style={styles.debugText}>
                Current Status: {isPremium ? 'Premium' : 'Free'}
              </Text>
            </View>
          </View>
        )}

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>

          <TouchableOpacity style={styles.menuItem} onPress={handleRateUs}>
            <Text style={styles.menuText}>Rate Us</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleJoinDiscord}>
            <Text style={styles.menuText}>Contact Us on Discord</Text>
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
                  index === languageOptions.length - 1 && styles.lastLanguageOption,
                ]}
                onPress={() => handleLanguageSelect(option.value)}
              >
                <Text style={[
                  styles.languageOptionText,
                  currentLanguage === option.value && styles.selectedLanguageOptionText,
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
  loadingIndicator: {
    marginVertical: 20,
  },
  testModeActive: {
    color: '#27C46A',
  },
  testModeInactive: {
    color: '#FF3B30',
  },
  lastLanguageOption: {
    borderBottomWidth: 0,
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
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    marginRight: 6,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  menuItemLeft: {
    flex: 1,
  },
  menuSubtitle: {
    fontSize: 12,
    color: theme.colors.gray,
    marginTop: 2,
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
