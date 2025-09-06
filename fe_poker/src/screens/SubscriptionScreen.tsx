import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  Linking,
} from 'react-native';
import { theme } from '../theme';
import revenueCatService, { SubscriptionPlan, PremiumFeatures } from '../services/RevenueCatService';

export const SubscriptionScreen: React.FC<{ navigation: any }> = () => {
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
              price: pkg.product.priceString,
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

      // 找到對應的package - 先嘗試套餐 identifier，再嘗試產品 identifier
      for (const offering of offerings) {
        // 先嘗試用套餐 identifier 搜尋
        packageToPurchase = offering.availablePackages.find(
          pkg => pkg.identifier === plan.id
        );

        // 如果沒找到，嘗試用產品 identifier 搜尋
        if (!packageToPurchase) {
          packageToPurchase = offering.availablePackages.find(
            pkg => pkg.product.identifier === plan.id
          );
        }

        if (packageToPurchase) {
          console.log('✅ Found matching package:', packageToPurchase.identifier);
          console.log('✅ Product identifier:', packageToPurchase.product.identifier);
          break;
        }
      }

      if (!packageToPurchase) {
        console.error('❌ Package not found. Looking for:', plan.id);
        console.error('❌ Available packages:', offerings.map(o =>
          o.availablePackages.map(p => ({
            identifier: p.identifier,
            product: p.product.identifier,
          }))).flat());
        throw new Error('Package not found');
      }

      await revenueCatService.purchasePackage(packageToPurchase);

      Alert.alert(
        'Purchase Successful!',
        'Thank you for subscribing to AI Solver Premium!',
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

  const handleOpenPrivacyPolicy = async () => {
    try {
      const url = 'https://poker-aisolver.com/privacy';
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Unable to open privacy policy link. Please try again later.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open privacy policy. Please try again later.');
      console.error('Failed to open privacy policy:', error);
    }
  };

  const handleOpenTermsOfService = async () => {
    try {
      const url = 'https://poker-aisolver.com/terms';
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Unable to open terms of service link. Please try again later.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open terms of service. Please try again later.');
      console.error('Failed to open terms of service:', error);
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

      {/* Header with AI Solver Logo */}
      <View style={styles.header}>
        <Image source={require('../../assets/appstore.png')} style={styles.logoImage} resizeMode="contain" />
        <Text style={styles.title}>AI Solver Pro</Text>
      </View>

      {/* Features List */}
      <View style={styles.featuresContainer}>
        <View style={styles.featureItem}>
          <View style={styles.checkmarkContainer}>
            <Text style={styles.checkmark}>✓</Text>
          </View>
          <Text style={styles.featureText}>Unlimited AI solver analysis</Text>
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
        <View style={styles.planRow}>
          {/* Annual Plan */}
          <TouchableOpacity
            style={[styles.planCard, styles.planCardHalf, selectedPlan === 'annual' && styles.selectedPlan]}
            onPress={() => {
              console.log('🔴 Annual plan clicked!');
              setSelectedPlan('annual');
            }}
            activeOpacity={0.7}
          >
            <View style={styles.discountBadgeInline}>
              <Text style={styles.discountText}>33% OFF</Text>
            </View>
            <View style={styles.planHeader}>
              <View style={styles.planLeft}>
                <Text style={styles.planTitle}>Year</Text>
                <Text style={styles.planPrice}>$75</Text>
                <Text style={styles.planSubPrice}>$6.25/month</Text>
              </View>
              <View style={[styles.radioButton, selectedPlan === 'annual' && styles.radioSelected]}>
                {selectedPlan === 'annual' && <View style={styles.radioInner} />}
              </View>
            </View>
          </TouchableOpacity>

          {/* Monthly Plan */}
          <TouchableOpacity
            style={[styles.planCard, styles.planCardHalf, selectedPlan === 'monthly' && styles.selectedPlan]}
            onPress={() => {
              console.log('🟢 Monthly plan clicked!');
              setSelectedPlan('monthly');
            }}
            activeOpacity={0.7}
          >
            <View style={styles.planHeader}>
              <View style={styles.planLeft}>
                <Text style={styles.planTitle}>Month</Text>
                <Text style={styles.planPrice}>$8.99/mo</Text>
                <Text style={styles.planSubPrice}>Billed monthly</Text>
              </View>
              <View style={[styles.radioButton, selectedPlan === 'monthly' && styles.radioSelected]}>
                {selectedPlan === 'monthly' && <View style={styles.radioInner} />}
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* CTA Button */}
      <TouchableOpacity
        style={styles.ctaButton}
        onPress={() => {
          const productId = selectedPlan === 'annual'
            ? '$rc_annual'
            : '$rc_monthly';
          const planData = {
            id: productId,
            title: 'AI Solver Premium',
            description: 'All premium features unlocked',
            price: selectedPlan === 'annual' ? '$75/year' : '$8.99/month',
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
        <TouchableOpacity style={styles.footerLinkRight} onPress={handleOpenTermsOfService}>
          <Text style={styles.footerLink}>Terms</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.footerLinkRight} onPress={handleOpenPrivacyPolicy}>
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
    paddingTop: 20,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    alignItems: 'center',
  },
  logoImage: {
    width: 72,
    height: 72,
    marginBottom: theme.spacing.sm,
    borderRadius: 16,
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
  planRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  planCardWrapper: {
    flex: 1,
    position: 'relative',
  },
  planCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.xs,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  planCardHalf: {
    flex: 1,
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
  discountBadgeInline: {
    alignSelf: 'flex-start',
    backgroundColor: '#FF6B35',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: theme.spacing.xs,
  },
  discountBadgeCenterContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: -8,
    alignItems: 'center',
    zIndex: 2,
    pointerEvents: 'none', // 確保不會阻擋點擊事件
  },
  discountBadgeCenter: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
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
    marginBottom: theme.spacing.lg,
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
    marginTop: theme.spacing.xs, // 更靠近 Subscribe 按鈕
    marginBottom: 40, // 調整底部間距
    paddingBottom: 10, // 調整內邊距
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
  },
  footerLink: {
    color: '#FF6B35',
    fontSize: theme.font.size.small,
    fontWeight: '600',
  },
  footerLinkRight: {
    marginLeft: theme.spacing.md,
  },
});
