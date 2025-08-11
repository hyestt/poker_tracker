import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Purchases, {
  CustomerInfo,
  PurchasesOffering,
  PurchasesPackage,
} from 'react-native-purchases';

// RevenueCat API Keys (需要在RevenueCat Dashboard中獲取)
const REVENUECAT_API_KEY = {
  ios: 'appl_BwKUCybSdHvHESLRhDGVjAfAcLC', // 替换为你的iOS API Key
  android: 'goog_YOUR_ANDROID_API_KEY_HERE', // 替换为你的Android API Key
};

// 開發環境標誌
const IS_DEVELOPMENT = __DEV__;

// 測試模式儲存 key
const TEST_PREMIUM_KEY = 'test_premium_status';

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

export interface GTOAnalysisQuota {
  date: string;
  usedCount: number;
  maxFreeCount: number;
}

class RevenueCatService {
  private isInitialized = false;

  async initialize(userId?: string): Promise<void> {
    try {
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
      console.log('🔧 Continuing despite RevenueCat error, using fallback mode');
      this.isInitialized = true;
      return;
    }
  }

  async getOfferings(): Promise<PurchasesOffering[]> {
    // 如果API Key未配置，返回空陣列
    if (!this.isRealRevenueCatConfigured()) {
      return [];
    }

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
      // 如果API Key未配置，返回模擬數據
      if (!this.isRealRevenueCatConfigured()) {
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
            isPopular: pkg.identifier.includes('monthly'),
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
      // 如果API Key未配置，模擬購買成功
      if (!this.isRealRevenueCatConfigured()) {
        console.log('🔧 Mock mode: Simulating purchase success');
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
      // 如果API Key未配置，模擬恢復購買
      if (!this.isRealRevenueCatConfigured()) {
        console.log('🔧 Mock mode: Simulating restore purchases');
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
      // 如果API Key未配置，返回模擬數據
      if (!this.isRealRevenueCatConfigured()) {
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
      // 如果API Key未配置，檢查測試模式設定
      if (!this.isRealRevenueCatConfigured()) {
        const testPremiumStatus = await AsyncStorage.getItem(TEST_PREMIUM_KEY);
        return testPremiumStatus === 'true';
      }

      // 確保服務已初始化
      if (!this.isInitialized) {
        console.warn('⚠️ RevenueCat not initialized yet, returning false for premium status');
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
      
      // 如果有任何激活的entitlement，就认为是premium用户，启用所有功能
      const hasPremium = Object.keys(activeEntitlements).length > 0;

      return {
        unlimitedSessions: hasPremium,
        aiAnalysis: hasPremium,
        advancedStats: hasPremium,
        exportData: hasPremium,
        cloudSync: hasPremium,
        customTags: hasPremium,
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
    if (!period) {return 'One-time';}

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
      'Priority support',
    ];

    if (planId.includes('premium')) {
      return [
        ...baseFeatures,
        'Exclusive premium features',
        'Early access to new features',
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
        id: 'custom', // 匹配RevenueCat中的package ID
        title: 'Premium Subscription',
        description: '無限 GTO 分析 + 所有功能',
        price: '$4.99',
        period: '每月',
        features: this.getFeaturesForPlan('custom'),
        isPopular: true,
      },
    ];
  }

  private getMockCustomerInfo(isPremium: boolean): any {
    const entitlements = isPremium
      ? { active: { pro: { identifier: 'pro', isActive: true } } }
      : { active: {} };

    return {
      entitlements,
      // ...其他模擬的 CustomerInfo 屬性
    };
  }

  // 測試用方法：設定測試的付費狀態
  async setTestPremiumStatus(isPremium: boolean): Promise<void> {
    await AsyncStorage.setItem(TEST_PREMIUM_KEY, isPremium.toString());
    console.log(`🧪 Test mode: Premium status set to ${isPremium}`);
  }

  // 測試用方法：取得目前測試的付費狀態
  async getTestPremiumStatus(): Promise<boolean> {
    const testStatus = await AsyncStorage.getItem(TEST_PREMIUM_KEY);
    return testStatus === 'true';
  }

  // 測試用方法：清除測試狀態
  async clearTestPremiumStatus(): Promise<void> {
    await AsyncStorage.removeItem(TEST_PREMIUM_KEY);
    console.log('🧪 Test mode: Premium status cleared');
  }

  // ==================== GTO Analysis Quota Management ====================

  async getGTOAnalysisQuota(): Promise<GTOAnalysisQuota> {
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      const quotaData = await AsyncStorage.getItem('gto_analysis_quota');

      if (quotaData) {
        const quota: GTOAnalysisQuota = JSON.parse(quotaData);

        // If it's a new day, reset the quota
        if (quota.date !== today) {
          const newQuota: GTOAnalysisQuota = {
            date: today,
            usedCount: 0,
            maxFreeCount: 1,
          };
          await AsyncStorage.setItem('gto_analysis_quota', JSON.stringify(newQuota));
          return newQuota;
        }

        return quota;
      } else {
        // First time - create new quota
        const newQuota: GTOAnalysisQuota = {
          date: today,
          usedCount: 0,
          maxFreeCount: 1,
        };
        await AsyncStorage.setItem('gto_analysis_quota', JSON.stringify(newQuota));
        return newQuota;
      }
    } catch (error) {
      console.error('Failed to get GTO analysis quota:', error);
      // Return default quota on error
      return {
        date: new Date().toISOString().split('T')[0],
        usedCount: 0,
        maxFreeCount: 1,
      };
    }
  }

  async canUseGTOAnalysis(): Promise<{ canUse: boolean; isPremium: boolean; remainingFree: number; needsPremium: boolean }> {
    try {
      const isPremium = await this.isPremiumUser();

      // Premium users have unlimited access
      if (isPremium) {
        return {
          canUse: true,
          isPremium: true,
          remainingFree: -1, // -1 indicates unlimited
          needsPremium: false,
        };
      }

      // Non-premium users have daily quota
      const quota = await this.getGTOAnalysisQuota();
      const remainingFree = Math.max(0, quota.maxFreeCount - quota.usedCount);
      const canUse = remainingFree > 0;

      return {
        canUse,
        isPremium: false,
        remainingFree,
        needsPremium: !canUse,
      };
    } catch (error) {
      console.error('Failed to check GTO analysis availability:', error);
      return {
        canUse: false,
        isPremium: false,
        remainingFree: 0,
        needsPremium: true,
      };
    }
  }

  async useGTOAnalysis(): Promise<boolean> {
    try {
      const { canUse, isPremium } = await this.canUseGTOAnalysis();

      if (!canUse) {
        return false;
      }

      // Premium users don't need quota tracking
      if (isPremium) {
        return true;
      }

      // Increment quota usage for non-premium users
      const quota = await this.getGTOAnalysisQuota();
      quota.usedCount += 1;
      await AsyncStorage.setItem('gto_analysis_quota', JSON.stringify(quota));

      console.log(`🎯 GTO Analysis used. Remaining free: ${quota.maxFreeCount - quota.usedCount}`);
      return true;
    } catch (error) {
      console.error('Failed to use GTO analysis:', error);
      return false;
    }
  }

  // Test method: reset daily quota (for testing purposes)
  async resetGTOQuotaForTesting(): Promise<void> {
    try {
      await AsyncStorage.removeItem('gto_analysis_quota');
      console.log('🧪 Test mode: GTO Analysis quota reset');
    } catch (error) {
      console.error('Failed to reset GTO quota:', error);
    }
  }
}

const revenueCatService = new RevenueCatService();
export default revenueCatService;
