import { Platform } from 'react-native';
import Purchases, { 
  CustomerInfo, 
  PurchasesOffering, 
  PurchasesPackage,
  PURCHASE_TYPE 
} from 'react-native-purchases';

// RevenueCat API Keys (需要在RevenueCat Dashboard中獲取)
const REVENUECAT_API_KEY = {
  ios: 'appl_YOUR_IOS_API_KEY_HERE',
  android: 'goog_YOUR_ANDROID_API_KEY_HERE'
};

// 開發環境標誌
const IS_DEVELOPMENT = __DEV__;

export interface SubscriptionPlan {
  id: string;
  title: string;
  description: string;
  price: string;
  period: string;
  features: string[];
  isPopular?: boolean;
}

export interface PremiumFeatures {
  unlimitedSessions: boolean;
  aiAnalysis: boolean;
  advancedStats: boolean;
  exportData: boolean;
  cloudSync: boolean;
  customTags: boolean;
}

class RevenueCatService {
  private isInitialized = false;

  async initialize(userId?: string): Promise<void> {
    try {
      // 在開發環境中跳過 RevenueCat 初始化
      if (IS_DEVELOPMENT) {
        console.log('🔧 Development mode: Skipping RevenueCat initialization');
        this.isInitialized = true;
        return;
      }

      // 根據平台選擇API Key
      const apiKey = Platform.OS === 'ios' ? REVENUECAT_API_KEY.ios : REVENUECAT_API_KEY.android;
      
      // 檢查API Key是否有效
      if (apiKey.includes('YOUR_') || apiKey.includes('_HERE')) {
        console.warn('⚠️ RevenueCat API Key not configured. Running in mock mode.');
        this.isInitialized = true;
        return;
      }
      
      await Purchases.configure({ apiKey });
      
      if (userId) {
        await Purchases.logIn(userId);
      }
      
      this.isInitialized = true;
      console.log('✅ RevenueCat initialized successfully');
    } catch (error) {
      console.error('❌ RevenueCat initialization failed:', error);
      // 在開發環境中不拋出錯誤，允許應用繼續運行
      if (IS_DEVELOPMENT) {
        console.log('🔧 Development mode: Continuing despite RevenueCat error');
        this.isInitialized = true;
        return;
      }
      throw error;
    }
  }

  async getOfferings(): Promise<PurchasesOffering[]> {
    if (!this.isInitialized) {
      throw new Error('RevenueCat not initialized');
    }

    try {
      const offerings = await Purchases.getOfferings();
      return offerings.all ? Object.values(offerings.all) : [];
    } catch (error) {
      console.error('❌ Failed to get offerings:', error);
      throw error;
    }
  }

  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    try {
      // 在開發環境或API Key未配置時返回模擬數據
      if (IS_DEVELOPMENT || !this.isRealRevenueCatConfigured()) {
        return this.getMockSubscriptionPlans();
      }

      const offerings = await this.getOfferings();
      const plans: SubscriptionPlan[] = [];

      offerings.forEach(offering => {
        offering.availablePackages.forEach(pkg => {
          plans.push({
            id: pkg.identifier,
            title: pkg.product.title,
            description: pkg.product.description,
            price: pkg.product.priceString,
            period: this.getPeriodString(pkg.product.subscriptionPeriod),
            features: this.getFeaturesForPlan(pkg.identifier),
            isPopular: pkg.identifier.includes('monthly')
          });
        });
      });

      return plans;
    } catch (error) {
      console.error('❌ Failed to get subscription plans:', error);
      // 返回模擬數據作為後備
      return this.getMockSubscriptionPlans();
    }
  }

  async purchasePackage(pkg: PurchasesPackage): Promise<CustomerInfo> {
    try {
      // 在開發環境中模擬購買成功
      if (IS_DEVELOPMENT || !this.isRealRevenueCatConfigured()) {
        console.log('🔧 Development mode: Simulating purchase success');
        return this.getMockCustomerInfo(true);
      }

      const { customerInfo } = await Purchases.purchasePackage(pkg);
      console.log('✅ Purchase successful:', customerInfo);
      return customerInfo;
    } catch (error) {
      console.error('❌ Purchase failed:', error);
      throw error;
    }
  }

  async restorePurchases(): Promise<CustomerInfo> {
    try {
      // 在開發環境中模擬恢復購買
      if (IS_DEVELOPMENT || !this.isRealRevenueCatConfigured()) {
        console.log('🔧 Development mode: Simulating restore purchases');
        return this.getMockCustomerInfo(false);
      }

      const customerInfo = await Purchases.restorePurchases();
      console.log('✅ Purchases restored:', customerInfo);
      return customerInfo;
    } catch (error) {
      console.error('❌ Restore purchases failed:', error);
      throw error;
    }
  }

  async getCustomerInfo(): Promise<CustomerInfo> {
    try {
      // 在開發環境中返回模擬數據
      if (IS_DEVELOPMENT || !this.isRealRevenueCatConfigured()) {
        return this.getMockCustomerInfo(false);
      }

      return await Purchases.getCustomerInfo();
    } catch (error) {
      console.error('❌ Failed to get customer info:', error);
      // 在開發環境中返回模擬數據作為後備
      if (IS_DEVELOPMENT) {
        return this.getMockCustomerInfo(false);
      }
      throw error;
    }
  }

  async isPremiumUser(): Promise<boolean> {
    try {
      // 在開發環境中返回 false（免費用戶）
      if (IS_DEVELOPMENT || !this.isRealRevenueCatConfigured()) {
        return false;
      }

      const customerInfo = await this.getCustomerInfo();
      return Object.keys(customerInfo.entitlements.active).length > 0;
    } catch (error) {
      console.error('❌ Failed to check premium status:', error);
      return false;
    }
  }

  async getPremiumFeatures(): Promise<PremiumFeatures> {
    try {
      const customerInfo = await this.getCustomerInfo();
      const activeEntitlements = customerInfo.entitlements.active;

      return {
        unlimitedSessions: 'unlimited_sessions' in activeEntitlements,
        aiAnalysis: 'ai_analysis' in activeEntitlements,
        advancedStats: 'advanced_stats' in activeEntitlements,
        exportData: 'export_data' in activeEntitlements,
        cloudSync: 'cloud_sync' in activeEntitlements,
        customTags: 'custom_tags' in activeEntitlements,
      };
    } catch (error) {
      console.error('❌ Failed to get premium features:', error);
      return {
        unlimitedSessions: false,
        aiAnalysis: false,
        advancedStats: false,
        exportData: false,
        cloudSync: false,
        customTags: false,
      };
    }
  }

  async logOut(): Promise<void> {
    try {
      await Purchases.logOut();
      console.log('✅ User logged out from RevenueCat');
    } catch (error) {
      console.error('❌ Failed to log out:', error);
    }
  }

  private getPeriodString(period: string | null): string {
    if (!period) return 'One-time';
    
    switch (period.toLowerCase()) {
      case 'p1w': return 'Weekly';
      case 'p1m': return 'Monthly';
      case 'p3m': return 'Quarterly';
      case 'p6m': return 'Semi-annually';
      case 'p1y': return 'Yearly';
      default: return 'Unknown';
    }
  }

  private getFeaturesForPlan(planId: string): string[] {
    const baseFeatures = [
      'Unlimited session recording',
      'AI-powered hand analysis',
      'Advanced statistics',
      'Data export',
      'Cloud synchronization',
      'Custom tags and notes',
      'Priority support'
    ];

    if (planId.includes('premium')) {
      return [
        ...baseFeatures,
        'Exclusive premium features',
        'Early access to new features'
      ];
    }

    return baseFeatures;
  }

  private isRealRevenueCatConfigured(): boolean {
    const apiKey = Platform.OS === 'ios' ? REVENUECAT_API_KEY.ios : REVENUECAT_API_KEY.android;
    return !apiKey.includes('YOUR_') && !apiKey.includes('_HERE');
  }

  private getMockSubscriptionPlans(): SubscriptionPlan[] {
    return [
      {
        id: 'poker_tracker_monthly_premium',
        title: 'Monthly Premium',
        description: 'Full access to all premium features',
        price: '$9.99',
        period: 'Monthly',
        features: [
          'Unlimited session recording',
          'AI-powered hand analysis',
          'Advanced statistics',
          'Data export',
          'Cloud synchronization',
          'Custom tags and notes',
          'Priority support'
        ],
        isPopular: true
      },
      {
        id: 'poker_tracker_yearly_premium',
        title: 'Yearly Premium',
        description: 'Best value - Save 17% with annual billing',
        price: '$99.99',
        period: 'Yearly',
        features: [
          'Unlimited session recording',
          'AI-powered hand analysis',
          'Advanced statistics',
          'Data export',
          'Cloud synchronization',
          'Custom tags and notes',
          'Priority support',
          'Exclusive premium features',
          'Early access to new features'
        ],
        isPopular: false
      }
    ];
  }

  private getMockCustomerInfo(isPremium: boolean): any {
    // 創建一個基本的 CustomerInfo 模擬對象
    return {
      originalAppUserId: 'mock_user_id',
      allPurchaseDates: {},
      allExpirationDates: {},
      entitlements: {
        active: isPremium ? {
          'premium': {
            identifier: 'premium',
            isActive: true,
            willRenew: true,
            periodType: 'NORMAL',
            latestPurchaseDate: new Date().toISOString(),
            originalPurchaseDate: new Date().toISOString(),
            expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
            store: 'APP_STORE',
            productIdentifier: 'poker_tracker_monthly_premium',
            isSandbox: true,
            unsubscribeDetectedAt: null,
            billingIssueDetectedAt: null
          }
        } : {},
        all: {}
      },
      activeSubscriptions: isPremium ? ['poker_tracker_monthly_premium'] : [],
      allPurchasedProductIdentifiers: isPremium ? ['poker_tracker_monthly_premium'] : [],
      nonSubscriptionTransactions: [],
      firstSeen: new Date().toISOString(),
      originalApplicationVersion: '1.0.0',
      requestDate: new Date().toISOString(),
      latestExpirationDate: isPremium ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null,
      originalPurchaseDate: isPremium ? new Date().toISOString() : null,
      managementURL: null,
      subscriptionsByProductIdentifier: {}
    };
  }
}

export const revenueCatService = new RevenueCatService();
export default revenueCatService; 