import { Platform } from 'react-native';
import mobileAds, {
  BannerAd,
  BannerAdSize,
  TestIds,
  InterstitialAd,
  AdEventType,
  RewardedAd,
  RewardedAdEventType,
  AppOpenAd,
} from 'react-native-google-mobile-ads';

// AdMob Ad Unit IDs (開發環境使用測試 ID)
const AD_UNIT_IDS = {
  banner: {
    ios: __DEV__ ? TestIds.BANNER : 'ca-app-pub-YOUR_IOS_APP_ID/YOUR_BANNER_ID',
    android: __DEV__ ? TestIds.BANNER : 'ca-app-pub-YOUR_ANDROID_APP_ID/YOUR_BANNER_ID'
  },
  interstitial: {
    ios: __DEV__ ? TestIds.INTERSTITIAL : 'ca-app-pub-YOUR_IOS_APP_ID/YOUR_INTERSTITIAL_ID',
    android: __DEV__ ? TestIds.INTERSTITIAL : 'ca-app-pub-YOUR_ANDROID_APP_ID/YOUR_INTERSTITIAL_ID'
  },
  rewarded: {
    ios: __DEV__ ? TestIds.REWARDED : 'ca-app-pub-YOUR_IOS_APP_ID/YOUR_REWARDED_ID',
    android: __DEV__ ? TestIds.REWARDED : 'ca-app-pub-YOUR_ANDROID_APP_ID/YOUR_REWARDED_ID'
  },
  appOpen: {
    ios: __DEV__ ? TestIds.APP_OPEN : 'ca-app-pub-YOUR_IOS_APP_ID/YOUR_APP_OPEN_ID',
    android: __DEV__ ? TestIds.APP_OPEN : 'ca-app-pub-YOUR_ANDROID_APP_ID/YOUR_APP_OPEN_ID'
  }
};

export interface AdMobConfig {
  enableBannerAds: boolean;
  enableInterstitialAds: boolean;
  enableRewardedAds: boolean;
  enableAppOpenAds: boolean;
  interstitialFrequency: number;
  rewardedAdRewards: {
    [key: string]: number;
  };
}

class AdMobService {
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;
  private interstitialAd: InterstitialAd | null = null;
  private rewardedAd: RewardedAd | null = null;
  private appOpenAd: AppOpenAd | null = null;
  private actionCount = 0;
  private config: AdMobConfig = {
    enableBannerAds: true,
    enableInterstitialAds: true,
    enableRewardedAds: true,
    enableAppOpenAds: true,
    interstitialFrequency: 3,
    rewardedAdRewards: {
      'extra_chips': 1000,
      'premium_analysis': 1,
      'remove_ads_1hour': 1
    }
  };

  async initialize(): Promise<void> {
    // 防止重複初始化
    if (this.isInitialized) {
      return;
    }

    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.performInitialization();
    return this.initializationPromise;
  }

  private async performInitialization(): Promise<void> {
    try {
      console.log('🎯 Starting AdMob initialization...');
      
      // 初始化 Google Mobile Ads SDK
      const initResult = await mobileAds().initialize();
      console.log('📱 AdMob SDK initialized:', initResult);
      
      // 設置請求配置（使用更簡單的配置）
      await mobileAds().setRequestConfiguration({
        testDeviceIdentifiers: __DEV__ ? ['EMULATOR'] : [],
        tagForChildDirectedTreatment: false,
        tagForUnderAgeOfConsent: false,
      });

      // 延遲預載廣告，避免初始化衝突
      if (__DEV__) {
        setTimeout(() => {
          this.preloadAds().catch(error => {
            console.warn('⚠️ Failed to preload ads:', error);
          });
        }, 2000);
      }
      
      this.isInitialized = true;
      console.log('✅ AdMob initialized successfully');
    } catch (error) {
      console.error('❌ AdMob initialization failed:', error);
      // 不拋出錯誤，讓應用繼續運行
      this.isInitialized = false;
    }
  }

  private async preloadAds(): Promise<void> {
    try {
      console.log('📱 Preloading test ads...');
      
      // 只在開發環境預載測試廣告
      if (__DEV__ && this.config.enableInterstitialAds) {
        await this.loadInterstitialAd();
      }

      if (__DEV__ && this.config.enableRewardedAds) {
        await this.loadRewardedAd();
      }

      if (__DEV__ && this.config.enableAppOpenAds) {
        await this.loadAppOpenAd();
      }
    } catch (error) {
      console.error('❌ Failed to preload ads:', error);
    }
  }

  private async loadInterstitialAd(): Promise<void> {
    try {
      const adUnitId = Platform.OS === 'ios' 
        ? AD_UNIT_IDS.interstitial.ios 
        : AD_UNIT_IDS.interstitial.android;

      this.interstitialAd = InterstitialAd.createForAdRequest(adUnitId);
      
      this.interstitialAd.addAdEventListener(AdEventType.LOADED, () => {
        console.log('📱 Interstitial ad loaded');
      });

      this.interstitialAd.addAdEventListener(AdEventType.ERROR, (error) => {
        console.error('❌ Interstitial ad error:', error);
      });

      this.interstitialAd.addAdEventListener(AdEventType.CLOSED, () => {
        console.log('📱 Interstitial ad closed');
        // 重新載入下一個廣告
        setTimeout(() => this.loadInterstitialAd(), 1000);
      });

      await this.interstitialAd.load();
    } catch (error) {
      console.error('❌ Failed to load interstitial ad:', error);
    }
  }

  private async loadRewardedAd(): Promise<void> {
    try {
      const adUnitId = Platform.OS === 'ios' 
        ? AD_UNIT_IDS.rewarded.ios 
        : AD_UNIT_IDS.rewarded.android;

      this.rewardedAd = RewardedAd.createForAdRequest(adUnitId);
      
      this.rewardedAd.addAdEventListener(RewardedAdEventType.LOADED, () => {
        console.log('🎁 Rewarded ad loaded');
      });

      this.rewardedAd.addAdEventListener(AdEventType.ERROR, (error) => {
        console.error('❌ Rewarded ad error:', error);
      });

      this.rewardedAd.addAdEventListener(RewardedAdEventType.EARNED_REWARD, (reward) => {
        console.log('🎁 User earned reward:', reward);
      });

      this.rewardedAd.addAdEventListener(AdEventType.CLOSED, () => {
        console.log('🎁 Rewarded ad closed');
        // 重新載入下一個廣告
        setTimeout(() => this.loadRewardedAd(), 1000);
      });

      await this.rewardedAd.load();
    } catch (error) {
      console.error('❌ Failed to load rewarded ad:', error);
    }
  }

  private async loadAppOpenAd(): Promise<void> {
    try {
      const adUnitId = Platform.OS === 'ios' 
        ? AD_UNIT_IDS.appOpen.ios 
        : AD_UNIT_IDS.appOpen.android;

      this.appOpenAd = AppOpenAd.createForAdRequest(adUnitId);
      
      this.appOpenAd.addAdEventListener(AdEventType.LOADED, () => {
        console.log('🚀 App open ad loaded');
      });

      this.appOpenAd.addAdEventListener(AdEventType.ERROR, (error) => {
        console.error('❌ App open ad error:', error);
      });

      this.appOpenAd.addAdEventListener(AdEventType.CLOSED, () => {
        console.log('🚀 App open ad closed');
        // 重新載入下一個廣告
        setTimeout(() => this.loadAppOpenAd(), 1000);
      });

      await this.appOpenAd.load();
    } catch (error) {
      console.error('❌ Failed to load app open ad:', error);
    }
  }

  // 獲取橫幅廣告 Unit ID
  getBannerAdUnitId(): string {
    return Platform.OS === 'ios' 
      ? AD_UNIT_IDS.banner.ios 
      : AD_UNIT_IDS.banner.android;
  }

  // 顯示插頁廣告（根據頻率控制）
  async showInterstitialAd(force: boolean = false): Promise<boolean> {
    if (!this.isInitialized || !this.config.enableInterstitialAds) {
      console.log('📱 Interstitial ads not available');
      return false;
    }

    this.actionCount++;

    // 檢查是否應該顯示廣告
    if (!force && this.actionCount % this.config.interstitialFrequency !== 0) {
      return false;
    }

    try {
      if (this.interstitialAd?.loaded) {
        await this.interstitialAd.show();
        return true;
      } else {
        console.log('📱 Interstitial ad not ready');
      }
    } catch (error) {
      console.error('❌ Failed to show interstitial ad:', error);
    }

    return false;
  }

  // 顯示獎勵廣告
  async showRewardedAd(): Promise<{ success: boolean; reward?: any }> {
    if (!this.isInitialized || !this.config.enableRewardedAds) {
      console.log('🎁 Rewarded ads not available');
      return { success: false };
    }

    try {
      if (this.rewardedAd?.loaded) {
        return new Promise((resolve) => {
          const rewardListener = this.rewardedAd!.addAdEventListener(
            RewardedAdEventType.EARNED_REWARD,
            (reward) => {
              rewardListener();
              resolve({ success: true, reward });
            }
          );

          const closeListener = this.rewardedAd!.addAdEventListener(
            AdEventType.CLOSED,
            () => {
              closeListener();
              resolve({ success: false });
            }
          );

          this.rewardedAd!.show();
        });
      } else {
        console.log('🎁 Rewarded ad not ready');
      }
    } catch (error) {
      console.error('❌ Failed to show rewarded ad:', error);
    }

    return { success: false };
  }

  // 顯示開屏廣告
  async showAppOpenAd(): Promise<boolean> {
    if (!this.isInitialized || !this.config.enableAppOpenAds) {
      console.log('🚀 App open ads not available');
      return false;
    }

    try {
      if (this.appOpenAd?.loaded) {
        await this.appOpenAd.show();
        return true;
      } else {
        console.log('🚀 App open ad not ready');
      }
    } catch (error) {
      console.error('❌ Failed to show app open ad:', error);
    }

    return false;
  }

  // 檢查廣告是否可用
  isInterstitialAdReady(): boolean {
    return this.isInitialized && (this.interstitialAd?.loaded ?? false);
  }

  isRewardedAdReady(): boolean {
    return this.isInitialized && (this.rewardedAd?.loaded ?? false);
  }

  isAppOpenAdReady(): boolean {
    return this.isInitialized && (this.appOpenAd?.loaded ?? false);
  }

  // 檢查是否已初始化
  isReady(): boolean {
    return this.isInitialized;
  }

  // 更新配置
  updateConfig(newConfig: Partial<AdMobConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // 獲取配置
  getConfig(): AdMobConfig {
    return { ...this.config };
  }

  // 重置動作計數器
  resetActionCount(): void {
    this.actionCount = 0;
  }

  // 獲取當前動作計數
  getActionCount(): number {
    return this.actionCount;
  }
}

export const adMobService = new AdMobService();
export default adMobService; 