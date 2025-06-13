import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ViewStyle,
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
  }, []);

  const initializeRevenueCat = async () => {
    try {
      await revenueCatService.initialize();
      await loadSubscriptionData();
    } catch (error) {
      console.error('Failed to initialize RevenueCat:', error);
      Alert.alert('Error', 'Failed to load subscription information');
    } finally {
      setLoading(false);
    }
  };

  const loadSubscriptionData = async () => {
    try {
      const [subscriptionPlans, premiumStatus, features] = await Promise.all([
        revenueCatService.getSubscriptionPlans(),
        revenueCatService.isPremiumUser(),
        revenueCatService.getPremiumFeatures(),
      ]);

      setPlans(subscriptionPlans);
      setIsPremium(premiumStatus);
      setPremiumFeatures(features);
    } catch (error) {
      console.error('Failed to load subscription data:', error);
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
        if (packageToPurchase) break;
      }

      if (!packageToPurchase) {
        throw new Error('Package not found');
      }

      await revenueCatService.purchasePackage(packageToPurchase);
      
      Alert.alert(
        'Purchase Successful!',
        'Thank you for subscribing to Poker Tracker Premium!',
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
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Poker Tracker Premium</Text>
        <Text style={styles.subtitle}>
          Unlock advanced features and take your poker game to the next level
        </Text>
      </View>

      {renderPremiumStatus()}

      {!isPremium && (
        <View style={styles.plansContainer}>
          <Text style={styles.sectionTitle}>Choose Your Plan</Text>
          {plans.map(renderSubscriptionPlan)}
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
    padding: theme.spacing.lg,
    alignItems: 'center',
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
    marginBottom: theme.spacing.md,
    padding: theme.spacing.lg,
    position: 'relative',
  },
  popularPlan: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
    backgroundColor: '#F8F9FF',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: 20,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
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
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.primary,
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
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: theme.spacing.sm,
  },
  featureText: {
    fontSize: theme.font.size.body,
    color: theme.colors.text,
    flex: 1,
  },
  subscribeButton: {
    marginTop: theme.spacing.sm,
  },
  popularButton: {
    backgroundColor: theme.colors.primary,
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
  disclaimer: {
    fontSize: theme.font.size.small,
    color: theme.colors.gray,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: theme.spacing.md,
  },
}); 