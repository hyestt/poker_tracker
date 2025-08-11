import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { theme } from '../theme';
import revenueCatService, { SubscriptionPlan, PremiumFeatures } from '../services/RevenueCatService';

export const SubscriptionScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [_plans, _setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [_isPremium, _setIsPremium] = useState(false);
  const [_premiumFeatures, _setPremiumFeatures] = useState<PremiumFeatures>({
    unlimitedSessions: false,
    aiAnalysis: false,
    advancedStats: false,
    exportData: false,
    cloudSync: false,
    customTags: false,
  });

  useEffect(() => {
    initializeRevenueCat();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const initializeRevenueCat = async () => {
    try {
      console.log('🔄 Initializing RevenueCat...');
      await revenueCatService.initialize();
      console.log('✅ RevenueCat initialized');
      await loadSubscriptionData();
      console.log('✅ Subscription data loaded');
    } catch (error: any) {
      console.error('❌ Failed to initialize RevenueCat:', error);
      // Don't show error to user during development - handle gracefully
      if (error.message && error.message.includes('configuration')) {
        console.log('🔧 Running in development mode - RevenueCat not configured');
      } else {
        console.log('🔧 RevenueCat initialization failed, continuing with fallback mode');
      }
    } finally {
      setLoading(false);
      console.log('✅ SubscriptionScreen initialization complete');
    }
  };

  const loadSubscriptionData = async () => {
    try {
      console.log('📊 Loading subscription data...');
      const [premiumStatus, features] = await Promise.all([
        revenueCatService.isPremiumUser(),
        revenueCatService.getPremiumFeatures(),
      ]);

      console.log('👑 Premium status:', premiumStatus);
      console.log('🎯 Premium features:', features);

      _setIsPremium(premiumStatus);
      _setPremiumFeatures(features);
    } catch (error) {
      console.error('❌ Failed to load subscription data:', error);
    }
  };

  const handlePurchase = async (plan: SubscriptionPlan) => {
    try {
      setPurchasing(plan.id);

      const offerings = await revenueCatService.getOfferings();
      let packageToPurchase = null;

      // 找到對應的package
      for (const offering of offerings) {
        packageToPurchase = offering.availablePackages.find(
          pkg => pkg.identifier === plan.id
        );
        if (packageToPurchase) {break;}
      }

      if (!packageToPurchase) {
        throw new Error('Package not found');
      }

      await revenueCatService.purchasePackage(packageToPurchase);

      Alert.alert(
        'Purchase Successful!',
        'Thank you for subscribing to LiveHand Premium!',
        [{ text: 'OK', onPress: () => loadSubscriptionData() }]
      );
    } catch (error: any) {
      if (error.userCancelled) {
        // User cancelled the purchase
        return;
      }

      // Check for RevenueCat configuration issues
      if (error.message && (error.message.includes('configuration') || error.message.includes('Package not found'))) {
        Alert.alert(
          'Development Mode',
          'This app is in development mode. Premium features will be unlocked for testing purposes.',
          [
            {
              text: 'Activate Premium',
              onPress: async () => {
                await revenueCatService.setTestPremiumStatus(true);
                _setIsPremium(true);
                Alert.alert(
                  'Premium Activated!',
                  'All premium features are now available for testing.',
                  [{ text: 'OK', onPress: () => loadSubscriptionData() }],
                );
              },
            },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
      } else {
        Alert.alert(
          'Purchase Failed',
          'Unable to complete the purchase. Please check your internet connection and try again.'
        );
      }
    } finally {
      setPurchasing(null);
    }
  };

  const handleRestorePurchases = async () => {
    try {
      setLoading(true);
      await revenueCatService.restorePurchases();
      await loadSubscriptionData();

      Alert.alert(
        'Restore Successful',
        'Your purchases have been restored!'
      );
    } catch (error: any) {
      // Handle development mode gracefully
      if (error.message && error.message.includes('configuration')) {
        Alert.alert(
          'Development Mode',
          'This app is in development mode. Premium features are already available for testing.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Restore Failed',
          'No previous purchases found or unable to connect to the App Store. Please try again later.'
        );
      }
    } finally {
      setLoading(false);
    }
  };




  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading subscription information...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with back button */}
      <View style={styles.headerWithNav}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            console.log('Back button pressed');
            navigation.goBack();
          }}
          activeOpacity={0.7}
          hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
        >
          <Text style={styles.backButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Pro Badge Header */}
      <View style={styles.header}>
        <View style={styles.proIconContainer}>
          <View style={styles.proIcon}>
            <Text style={styles.proIconText}>📊</Text>
            <View style={styles.proBadge}>
              <Text style={styles.proBadgeText}>pro</Text>
            </View>
          </View>
        </View>
        <Text style={styles.title}>LiveHand Pro</Text>
      </View>

      {/* Features List */}
      <View style={styles.featuresContainer}>
        <View style={styles.featureItem}>
          <View style={styles.checkmarkContainer}>
            <Text style={styles.checkmark}>✓</Text>
          </View>
          <Text style={styles.featureText}>Unlimited GTO analyses</Text>
        </View>
        <View style={styles.featureItem}>
          <View style={styles.checkmarkContainer}>
            <Text style={styles.checkmark}>✓</Text>
          </View>
          <Text style={styles.featureText}>Export to Contacts</Text>
        </View>
        <View style={styles.featureItem}>
          <View style={styles.checkmarkContainer}>
            <Text style={styles.checkmark}>✓</Text>
          </View>
          <Text style={styles.featureText}>Batch GTO Analysis</Text>
        </View>
      </View>

      {/* Pricing Plan */}
      <View style={styles.pricingContainer}>
        <View style={[styles.planCard, styles.selectedPlan]}>
          <View style={styles.planHeader}>
            <View style={styles.planLeft}>
              <Text style={styles.planTitle}>LiveHand Premium</Text>
              <Text style={styles.planPrice}>$4.99/month</Text>
              <Text style={styles.planBilling}>Billed monthly • Cancel anytime</Text>
            </View>
            <View style={[styles.radioButton, styles.radioSelected]}>
              <View style={styles.radioInner} />
            </View>
          </View>
        </View>
      </View>

      {/* CTA Button */}
      <TouchableOpacity
        style={styles.ctaButton}
        onPress={() => handlePurchase({
          id: 'custom',
          title: 'LiveHand Premium',
          description: 'All premium features unlocked',
          price: '$4.99/month',
          period: 'Month',
          features: [],
          isPopular: true,
        })}
        disabled={purchasing !== null}
      >
        {purchasing ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.ctaButtonText}>Get started for free</Text>
        )}
      </TouchableOpacity>

      {/* Footer Links */}
      <View style={styles.footer}>
        <TouchableOpacity onPress={handleRestorePurchases}>
          <Text style={styles.footerLink}>Restore Purchases</Text>
        </TouchableOpacity>
        <Text style={styles.footerSeparator}>•</Text>
        <TouchableOpacity>
          <Text style={styles.footerLink}>Terms</Text>
        </TouchableOpacity>
        <Text style={styles.footerSeparator}>•</Text>
        <TouchableOpacity>
          <Text style={styles.footerLink}>Privacy</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  headerWithNav: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingTop: 50,
    paddingBottom: theme.spacing.sm,
    zIndex: 10,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: theme.colors.gray,
    fontSize: 18,
    fontWeight: '400',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.font.size.body,
    color: theme.colors.text,
  },
  header: {
    paddingTop: 85,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    alignItems: 'center',
  },
  proIconContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  proIcon: {
    position: 'relative',
    width: 60,
    height: 60,
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  proIconText: {
    fontSize: 24,
  },
  proBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#2D3748',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  proBadgeText: {
    color: theme.colors.text,
    fontSize: 10,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: theme.font.size.small,
    color: theme.colors.gray,
    textAlign: 'center',
    lineHeight: 18,
  },
  featuresContainer: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    padding: theme.spacing.md,
    borderRadius: 12,
    marginBottom: theme.spacing.sm,
  },
  checkmarkContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#48BB78',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  checkmark: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  featureText: {
    fontSize: theme.font.size.body,
    color: theme.colors.text,
    flex: 1,
    fontWeight: '500',
  },
  trialInfo: {
    fontSize: theme.font.size.small,
    color: theme.colors.gray,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    lineHeight: 18,
  },
  pricingContainer: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  planCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.xs,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  selectedPlan: {
    borderColor: '#FF6B35',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planLeft: {
    flex: 1,
  },
  planTitle: {
    fontSize: theme.font.size.body,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 2,
  },
  planPrice: {
    fontSize: theme.font.size.small,
    color: theme.colors.text,
    fontWeight: '600',
    marginBottom: 2,
  },
  planBilling: {
    fontSize: 11,
    color: theme.colors.gray,
    lineHeight: 14,
  },
  radioButton: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: theme.colors.gray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    borderColor: '#FF6B35',
  },
  radioInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF6B35',
  },
  discountBadge: {
    position: 'absolute',
    top: -6,
    left: 12,
    backgroundColor: '#FF6B35',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  discountText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  ctaButton: {
    backgroundColor: '#FF6B35',
    marginHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
    height: 48,
  },
  ctaButtonText: {
    color: 'white',
    fontSize: theme.font.size.body,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  footerLink: {
    color: '#FF6B35',
    fontSize: theme.font.size.small,
    fontWeight: '600',
  },
  footerSeparator: {
    color: theme.colors.gray,
    marginHorizontal: 6,
  },
});
