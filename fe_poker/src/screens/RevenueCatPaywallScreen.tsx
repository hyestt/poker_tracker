import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { theme } from '../theme';
import RevenueCatUI from 'react-native-purchases-ui';
import revenueCatService from '../services/RevenueCatService';

export const RevenueCatPaywallScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [paywallAvailable, setPaywallAvailable] = useState(false);

  useEffect(() => {
    initializePaywall();
  }, []);

  const initializePaywall = async () => {
    try {
      console.log('🔄 Initializing RevenueCat paywall...');

      // Ensure RevenueCat is initialized
      await revenueCatService.initialize();

      // Check if offerings are available
      const offerings = await revenueCatService.getOfferings();
      if (offerings.length > 0) {
        setPaywallAvailable(true);
        console.log('✅ Paywall offerings available');
      } else {
        console.warn('⚠️ No paywall offerings found');
        setPaywallAvailable(false);
      }
    } catch (error) {
      console.error('❌ Failed to initialize paywall:', error);
      setPaywallAvailable(false);
    } finally {
      setLoading(false);
    }
  };

  const presentPaywall = async () => {
    try {
      console.log('🎯 Presenting RevenueCat paywall...');

      // Present the paywall modally
      await RevenueCatUI.presentPaywall({
        requiredEntitlementIdentifier: 'entl875d4f9caa', // Your entitlement identifier from RevenueCat
      });

      console.log('✅ Paywall presented successfully');

      // After paywall is dismissed, check if user is now premium
      const isPremium = await revenueCatService.isPremiumUser();
      if (isPremium) {
        Alert.alert(
          'Welcome to Premium!',
          'Thank you for upgrading to AI Solver Pro!',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    } catch (error: any) {
      console.error('❌ Paywall presentation failed:', error);

      if (error.userCancelled) {
        // User cancelled - no need to show error
        return;
      }

      Alert.alert(
        'Paywall Error',
        'Unable to show premium options. Please try again later.',
        [{ text: 'OK' }]
      );
    }
  };

  const presentPaywallIfNeeded = async () => {
    try {
      console.log('🎯 Presenting paywall if needed...');

      // This will only show paywall if user doesn't have the required entitlement
      await RevenueCatUI.presentPaywallIfNeeded({
        requiredEntitlementIdentifier: 'entl875d4f9caa',
      });

      console.log('✅ Paywall check completed');

      // Check premium status after
      const isPremium = await revenueCatService.isPremiumUser();
      if (isPremium) {
        Alert.alert(
          'Welcome to Premium!',
          'Thank you for upgrading to AI Solver Pro!',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    } catch (error: any) {
      console.error('❌ Paywall if needed failed:', error);

      if (error.userCancelled) {
        return;
      }

      Alert.alert(
        'Paywall Error',
        'Unable to show premium options. Please try again later.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleRestorePurchases = async () => {
    try {
      setLoading(true);
      await revenueCatService.restorePurchases();

      const isPremium = await revenueCatService.isPremiumUser();
      if (isPremium) {
        Alert.alert(
          'Purchases Restored!',
          'Your premium subscription has been restored.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert(
          'No Purchases Found',
          'No previous purchases were found to restore.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('❌ Restore purchases failed:', error);
      Alert.alert(
        'Restore Failed',
        'Unable to restore purchases. Please try again later.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading premium options...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with close button */}
      <View style={styles.headerWithNav}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
          hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
        >
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {paywallAvailable ? (
          <>
            <View style={styles.headerContent}>
              <Text style={styles.title}>AI Solver Pro</Text>
              <Text style={styles.subtitle}>Unlock all premium features</Text>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={presentPaywall}
                disabled={loading}
              >
                <Text style={styles.primaryButtonText}>
                  Show Premium Options
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={presentPaywallIfNeeded}
                disabled={loading}
              >
                <Text style={styles.secondaryButtonText}>
                  Check Premium Status
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.tertiaryButton}
                onPress={handleRestorePurchases}
                disabled={loading}
              >
                <Text style={styles.tertiaryButtonText}>
                  Restore Purchases
                </Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>Premium Options Unavailable</Text>
            <Text style={styles.errorText}>
              Premium features are currently unavailable. Please check your connection and try again.
            </Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={initializePaywall}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}
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
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
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
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: 100,
  },
  headerContent: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: theme.font.size.body,
    color: theme.colors.gray,
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonContainer: {
    gap: theme.spacing.md,
  },
  primaryButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: theme.spacing.md + 2,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: theme.font.size.body,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: theme.colors.card,
    paddingVertical: theme.spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FF6B35',
  },
  secondaryButtonText: {
    color: '#FF6B35',
    fontSize: theme.font.size.body,
    fontWeight: '600',
    textAlign: 'center',
  },
  tertiaryButton: {
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tertiaryButtonText: {
    color: theme.colors.gray,
    fontSize: theme.font.size.small,
    fontWeight: '500',
    textAlign: 'center',
  },
  errorContainer: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  errorTitle: {
    fontSize: theme.font.size.large,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  errorText: {
    fontSize: theme.font.size.body,
    color: theme.colors.gray,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: theme.spacing.lg,
  },
  retryButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: theme.font.size.body,
    fontWeight: '600',
  },
});
