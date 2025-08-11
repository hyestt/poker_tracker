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
import revenueCatService, { SubscriptionPlan, PremiumFeatures } from '../services/RevenueCatService';

export const SubscriptionScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [premiumFeatures, setPremiumFeatures] = useState<PremiumFeatures>({
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
    } catch (error) {
      console.error('❌ Failed to initialize RevenueCat:', error);
      Alert.alert('Error', 'Failed to load subscription information');
    } finally {
      setLoading(false);
      console.log('✅ SubscriptionScreen initialization complete');
    }
  };

  const loadSubscriptionData = async () => {
    try {
      console.log('📊 Loading subscription data...');
      const [subscriptionPlans, premiumStatus, features] = await Promise.all([
        revenueCatService.getSubscriptionPlans(),
        revenueCatService.isPremiumUser(),
        revenueCatService.getPremiumFeatures(),
      ]);

      console.log('📋 Subscription plans:', subscriptionPlans);
      console.log('👑 Premium status:', premiumStatus);
      console.log('🎯 Premium features:', features);

      setPlans(subscriptionPlans);
      setIsPremium(premiumStatus);
      setPremiumFeatures(features);
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

      Alert.alert(
        'Purchase Failed',
        error.message || 'Something went wrong. Please try again.'
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
    } catch (error) {
      Alert.alert(
        'Restore Failed',
        'No previous purchases found or restore failed.'
      );
    } finally {
      setLoading(false);
    }
  };

  const renderFeatureList = (features: string[]) => (
    <View style={styles.featureList}>
      {features.map((feature, index) => (
        <View key={index} style={styles.featureItem}>
          <Text style={styles.featureIcon}>✓</Text>
          <Text style={styles.featureText}>{feature}</Text>
        </View>
      ))}
    </View>
  );

  const renderPremiumStatus = () => {
    const statusCardStyle = isPremium ?
      { ...styles.statusCard, ...styles.premiumCard } :
      { ...styles.statusCard, ...styles.freeCard };

    return (
      <Card style={statusCardStyle}>
        <Text style={styles.statusTitle}>
          {isPremium ? '🎉 Premium Active' : '📱 Free Version'}
        </Text>
        <Text style={styles.statusDescription}>
          {isPremium
            ? 'You have access to all premium features!'
            : 'Upgrade to unlock advanced features and unlimited usage.'
          }
        </Text>

        {isPremium && (
          <View style={styles.activeFeatures}>
            <Text style={styles.activeFeaturesTitle}>Active Features:</Text>
            {Object.entries(premiumFeatures).map(([key, isActive]) =>
              isActive ? (
                <Text key={key} style={styles.activeFeatureItem}>
                  ✓ {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </Text>
              ) : null
            )}
          </View>
        )}
      </Card>
    );
  };

  const renderSubscriptionPlan = (plan: SubscriptionPlan) => {
    const planCardStyle = plan.isPopular ?
      { ...styles.planCard, ...styles.popularPlan } :
      styles.planCard;

    const buttonStyle = isPremium ?
      { ...styles.subscribeButton, ...styles.disabledButton } :
      plan.isPopular ?
        { ...styles.subscribeButton, ...styles.popularButton } :
        styles.subscribeButton;

    return (
      <Card key={plan.id} style={planCardStyle}>
        {plan.isPopular && (
          <View style={styles.popularBadge}>
            <Text style={styles.popularBadgeText}>Most Popular</Text>
          </View>
        )}

        <Text style={styles.planTitle}>{plan.title}</Text>
        <Text style={styles.planPrice}>{plan.price}</Text>
        <Text style={styles.planPeriod}>per {plan.period.toLowerCase()}</Text>
        <Text style={styles.planDescription}>{plan.description}</Text>

        {renderFeatureList(plan.features)}

        <Button
          title={purchasing === plan.id ? 'Processing...' : `Subscribe ${plan.price}`}
          onPress={() => handlePurchase(plan)}
          disabled={purchasing !== null || isPremium}
          style={buttonStyle}
        />

        {purchasing === plan.id && (
          <ActivityIndicator style={styles.loadingIndicator} color={theme.colors.primary} />
        )}
      </Card>
    );
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
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContainer}>
        <View style={styles.header}>
          <View style={styles.heroIcon}>
            <Text style={styles.heroIconText}>🚀</Text>
          </View>
          <Text style={styles.title}>LiveHand Premium</Text>
          <Text style={styles.subtitle}>
            Unlock advanced features and take your poker game to the next level
          </Text>
        </View>

      {/* Debug Info - Only show if no plans loaded */}
      {__DEV__ && plans.length === 0 && (
        <View style={styles.debugCard}>
          <Text style={styles.debugTitle}>🔧 Debug Info</Text>
          <Text style={styles.debugText}>Plans count: {plans.length}</Text>
          <Text style={styles.debugText}>Is Premium: {isPremium.toString()}</Text>
          <Text style={styles.debugText}>Loading: {loading.toString()}</Text>
        </View>
      )}

      {renderPremiumStatus()}

      {/* Free Features Section - Always show to explain the free tier */}
      <Card style={styles.freeFeatureCard}>
        <View style={styles.freeFeatureHeader}>
          <Text style={styles.freeFeatureIcon}>🎯</Text>
          <Text style={styles.freeFeatureTitle}>What's Always Free</Text>
        </View>
        <View style={styles.featureList}>
          <View style={styles.featureItem}>
            <View style={styles.featureIconContainer}>
              <Text style={styles.featureIcon}>✓</Text>
            </View>
            <Text style={styles.featureText}>Unlimited manual hand recording</Text>
          </View>
          <View style={styles.featureItem}>
            <View style={styles.featureIconContainer}>
              <Text style={styles.featureIcon}>✓</Text>
            </View>
            <Text style={styles.featureText}>1 free GTO analysis per day</Text>
          </View>
          <View style={styles.featureItem}>
            <View style={styles.featureIconContainer}>
              <Text style={styles.featureIcon}>✓</Text>
            </View>
            <Text style={styles.featureText}>Basic session tracking</Text>
          </View>
          <View style={styles.featureItem}>
            <View style={styles.featureIconContainer}>
              <Text style={styles.featureIcon}>✓</Text>
            </View>
            <Text style={styles.featureText}>Basic statistics</Text>
          </View>
        </View>
      </Card>

      {!isPremium && (
        <View style={styles.plansContainer}>
          <Text style={styles.sectionTitle}>🚀 Upgrade to Premium</Text>
          {plans.length > 0 ? (
            plans.map(renderSubscriptionPlan)
          ) : (
            <Card style={styles.planCard}>
              <Text style={styles.planTitle}>Premium Plans Loading...</Text>
              <Text style={styles.planDescription}>
                If this persists, please check your internet connection and try again.
              </Text>
              <TouchableOpacity
                style={styles.subscribeButton}
                onPress={() => {
                  setLoading(true);
                  initializeRevenueCat();
                }}
              >
                <Text style={styles.subscribeButtonText}>Retry Loading</Text>
              </TouchableOpacity>
            </Card>
          )}
        </View>
      )}

      <View style={styles.footer}>
        <TouchableOpacity style={styles.restoreButton} onPress={handleRestorePurchases}>
          <Text style={styles.restoreButtonText}>Restore Purchases</Text>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          Subscriptions will be charged to your Apple ID account. Auto-renewal may be turned off by going to Account Settings after purchase.
        </Text>
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
  scrollContainer: {
    flex: 1,
  },
  headerWithNav: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingTop: 50, // 更大的top padding for status bar
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border || '#E5E7EB',
    zIndex: 10,
  },
  backButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: 25,
    minWidth: 80,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: theme.font.size.small,
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
    padding: theme.spacing.xl,
    alignItems: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  heroIconText: {
    fontSize: 40,
  },
  title: {
    fontSize: theme.font.size.title,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.font.size.body,
    color: theme.colors.gray,
    textAlign: 'center',
    lineHeight: 22,
  },
  statusCard: {
    margin: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  premiumCard: {
    backgroundColor: '#E8F5E8',
    borderColor: '#4CAF50',
    borderWidth: 2,
  },
  freeCard: {
    backgroundColor: '#FFF3E0',
    borderColor: '#FF9800',
    borderWidth: 2,
  },
  freeFeatureCard: {
    margin: theme.spacing.md,
    padding: theme.spacing.lg,
    backgroundColor: '#F8FFFE',
    borderColor: '#10B981',
    borderWidth: 2,
    borderRadius: 16,
  },
  freeFeatureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  freeFeatureIcon: {
    fontSize: 24,
    marginRight: theme.spacing.sm,
  },
  freeFeatureTitle: {
    fontSize: theme.font.size.subtitle,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  featureIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  statusTitle: {
    fontSize: theme.font.size.subtitle,
    fontWeight: 'bold',
    marginBottom: theme.spacing.xs,
  },
  statusDescription: {
    fontSize: theme.font.size.body,
    color: theme.colors.gray,
    marginBottom: theme.spacing.md,
  },
  activeFeatures: {
    marginTop: theme.spacing.sm,
  },
  activeFeaturesTitle: {
    fontSize: theme.font.size.body,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  activeFeatureItem: {
    fontSize: theme.font.size.small,
    color: '#4CAF50',
    marginBottom: 2,
  },
  plansContainer: {
    padding: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.font.size.subtitle,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  planCard: {
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.xl,
    position: 'relative',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  popularPlan: {
    borderColor: theme.colors.primary,
    borderWidth: 3,
    backgroundColor: '#F0F4FF',
    transform: [{ scale: 1.02 }],
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    right: 24,
    backgroundColor: '#FF6B35',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  popularBadgeText: {
    color: 'white',
    fontSize: theme.font.size.small,
    fontWeight: 'bold',
  },
  planTitle: {
    fontSize: theme.font.size.subtitle,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  planPrice: {
    fontSize: 36,
    fontWeight: '800',
    color: theme.colors.primary,
    textAlign: 'center',
  },
  planPeriod: {
    fontSize: theme.font.size.body,
    color: theme.colors.gray,
    marginBottom: theme.spacing.sm,
  },
  planDescription: {
    fontSize: theme.font.size.body,
    color: theme.colors.gray,
    marginBottom: theme.spacing.md,
    lineHeight: 20,
  },
  featureList: {
    marginBottom: theme.spacing.lg,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  featureIcon: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  featureText: {
    fontSize: theme.font.size.body,
    color: theme.colors.text,
    flex: 1,
  },
  subscribeButton: {
    marginTop: theme.spacing.lg,
    borderRadius: 25,
    paddingVertical: theme.spacing.md,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  popularButton: {
    backgroundColor: theme.colors.primary,
    transform: [{ scale: 1.05 }],
  },
  disabledButton: {
    backgroundColor: theme.colors.gray,
    opacity: 0.6,
  },
  loadingIndicator: {
    marginTop: theme.spacing.sm,
  },
  footer: {
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  restoreButton: {
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  restoreButtonText: {
    fontSize: theme.font.size.body,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  subscribeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: theme.font.size.body,
    textAlign: 'center',
  },
  disclaimer: {
    fontSize: theme.font.size.small,
    color: theme.colors.gray,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: theme.spacing.md,
  },
  debugCard: {
    margin: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: '#FFF8E1',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FFA000',
  },
  debugTitle: {
    fontWeight: 'bold',
    marginBottom: theme.spacing.xs,
    color: '#F57C00',
  },
  debugText: {
    fontSize: theme.font.size.small,
    color: '#BF360C',
    marginBottom: 4,
  },
});
