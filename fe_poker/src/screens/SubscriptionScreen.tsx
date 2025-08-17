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
  const [selectedPlan, setSelectedPlan] = useState<'annual' | 'monthly'>('annual');
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

      // Check if we can get offerings
      try {
        const offerings = await revenueCatService.getOfferings();
        console.log('📦 Available offerings:', offerings.length);
        
        // 詳細記錄每個offering和package
        offerings.forEach((offering, index) => {
          console.log(`📦 Offering ${index}:`, offering.identifier);
          offering.availablePackages.forEach((pkg, pkgIndex) => {
            console.log(`  📱 Package ${pkgIndex}:`, {
              identifier: pkg.identifier,
              title: pkg.product.title,
              price: pkg.product.priceString
            });
          });
        });
        
        if (offerings.length === 0) {
          console.warn('⚠️ No offerings found - products may not be configured');
        }
      } catch (offerError) {
        console.error('❌ Failed to get offerings:', offerError);
      }

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

      console.log('🛒 Starting purchase for plan:', plan.id);
      const offerings = await revenueCatService.getOfferings();
      console.log('📦 Available offerings:', offerings.length);
      
      // 詳細打印所有可用的packages
      offerings.forEach((offering, index) => {
        console.log(`📦 Offering ${index}:`, offering.identifier);
        offering.availablePackages.forEach((pkg, pkgIndex) => {
          console.log(`  📱 Package ${pkgIndex}:`, pkg.identifier, pkg.product.title);
        });
      });

      let packageToPurchase = null;

      // 找到對應的package
      for (const offering of offerings) {
        packageToPurchase = offering.availablePackages.find(
          pkg => pkg.identifier === plan.id
        );
        if (packageToPurchase) {
          console.log('✅ Found matching package:', packageToPurchase.identifier);
          break;
        }
      }

      if (!packageToPurchase) {
        console.error('❌ Package not found. Looking for:', plan.id);
        console.error('❌ Available packages:', offerings.map(o => 
          o.availablePackages.map(p => p.identifier)).flat());
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

      console.error('❌ Purchase error details:', error);

      // Show detailed error information for debugging
      Alert.alert(
        'Purchase Error',
        `Error: ${error.message || 'Unknown error'}\n\nThis might be due to:\n• RevenueCat products not configured\n• App Store Connect products not set up\n• Network connectivity issues`,
        [
          {
            text: 'Test Mode (Activate Premium)',
            onPress: async () => {
              await revenueCatService.setTestPremiumStatus(true);
              _setIsPremium(true);
              Alert.alert(
                'Premium Activated (Test Mode)!',
                'All premium features are now available for testing.',
                [{ text: 'OK', onPress: () => loadSubscriptionData() }],
              );
            },
          },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
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
          <Text style={styles.featureText}>Unlimited GTO solver analysis</Text>
        </View>
        <View style={styles.featureItem}>
          <View style={styles.checkmarkContainer}>
            <Text style={styles.checkmark}>✓</Text>
          </View>
          <Text style={styles.featureText}>Offline Access</Text>
        </View>
        <View style={styles.featureItem}>
          <View style={styles.checkmarkContainer}>
            <Text style={styles.checkmark}>✓</Text>
          </View>
          <Text style={styles.featureText}>Advanced Filters and Search</Text>
        </View>
        <View style={styles.featureItem}>
          <View style={styles.checkmarkContainer}>
            <Text style={styles.checkmark}>✓</Text>
          </View>
          <Text style={styles.featureText}>Multi-language Support</Text>
        </View>
        <View style={styles.featureItem}>
          <View style={styles.checkmarkContainer}>
            <Text style={styles.checkmark}>✓</Text>
          </View>
          <Text style={styles.featureText}>Unlimited Hands and Sessions</Text>
        </View>
      </View>

      {/* Pricing Plans */}
      <View style={styles.pricingContainer}>
        {/* Annual Plan */}
        <TouchableOpacity
          style={[styles.planCard, selectedPlan === 'annual' && styles.selectedPlan]}
          onPress={() => setSelectedPlan('annual')}
          activeOpacity={0.7}
        >
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>33% OFF</Text>
          </View>
          <View style={styles.planHeader}>
            <View style={styles.planLeft}>
              <Text style={styles.planTitle}>Year</Text>
              <Text style={styles.planPrice}>$120</Text>
              <Text style={styles.planSubPrice}>$10/month</Text>
            </View>
            <View style={[styles.radioButton, selectedPlan === 'annual' && styles.radioSelected]}>
              {selectedPlan === 'annual' && <View style={styles.radioInner} />}
            </View>
          </View>
        </TouchableOpacity>

        {/* Monthly Plan */}
        <TouchableOpacity
          style={[styles.planCard, selectedPlan === 'monthly' && styles.selectedPlan]}
          onPress={() => setSelectedPlan('monthly')}
          activeOpacity={0.7}
        >
          <View style={styles.planHeader}>
            <View style={styles.planLeft}>
              <Text style={styles.planTitle}>Month</Text>
              <Text style={styles.planPrice}>$14.99/mo</Text>
            </View>
            <View style={[styles.radioButton, selectedPlan === 'monthly' && styles.radioSelected]}>
              {selectedPlan === 'monthly' && <View style={styles.radioInner} />}
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* CTA Button */}
      <TouchableOpacity
        style={styles.ctaButton}
        onPress={() => {
          const productId = selectedPlan === 'annual'
            ? 'com.livehand.pro.annual'
            : 'com.livehand.pro.monthly';
          const planData = {
            id: productId,
            title: 'LiveHand Premium',
            description: 'All premium features unlocked',
            price: selectedPlan === 'annual' ? '$120/year' : '$14.99/month',
            period: selectedPlan === 'annual' ? 'Year' : 'Month',
            features: [],
            isPopular: selectedPlan === 'annual',
          };
          handlePurchase(planData);
        }}
        disabled={purchasing !== null}
      >
        {purchasing ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.ctaButtonText}>Subscribe</Text>
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
  planSubPrice: {
    fontSize: 11,
    color: theme.colors.gray,
    fontWeight: '400',
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
    paddingVertical: theme.spacing.md + 2, // 增加垂直內邊距
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
    minHeight: 52, // 改用 minHeight 並增加到 52px
  },
  ctaButtonText: {
    color: 'white',
    fontSize: theme.font.size.body,
    fontWeight: 'bold',
    textAlign: 'center', // 確保文字居中
    lineHeight: theme.font.size.body + 2, // 設定行高避免文字被切
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
