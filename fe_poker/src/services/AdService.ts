import { 
  BannerAd, 
  BannerAdSize, 
  TestIds,
  InterstitialAd,
  AdEventType,
  RewardedAd,
  RewardedAdEventType,
} from 'react-native-google-mobile-ads';

export class AdService {
  private static interstitialAd: InterstitialAd | null = null;
  private static rewardedAd: RewardedAd | null = null;
  private static isInterstitialLoaded = false;
  private static isRewardedLoaded = false;

  // 測試廣告ID
  static readonly AD_UNIT_IDS = {
    BANNER: TestIds.BANNER,
    INTERSTITIAL: TestIds.INTERSTITIAL,
    REWARDED: TestIds.REWARDED,
  };

  // 初始化插頁式廣告
  static initializeInterstitialAd() {
    this.interstitialAd = InterstitialAd.createForAdRequest(this.AD_UNIT_IDS.INTERSTITIAL, {
      requestNonPersonalizedAdsOnly: true,
    });

    this.interstitialAd.addAdEventListener(AdEventType.LOADED, () => {
      this.isInterstitialLoaded = true;
      console.log('Interstitial ad loaded');
    });

    this.interstitialAd.addAdEventListener(AdEventType.ERROR, (error) => {
      console.error('Interstitial ad error:', error);
      this.isInterstitialLoaded = false;
    });

    this.interstitialAd.addAdEventListener(AdEventType.CLOSED, () => {
      this.isInterstitialLoaded = false;
      // 重新載入下一個廣告
      this.loadInterstitialAd();
    });

    this.loadInterstitialAd();
  }

  // 載入插頁式廣告
  static loadInterstitialAd() {
    if (this.interstitialAd) {
      this.interstitialAd.load();
    }
  }

  // 顯示插頁式廣告
  static showInterstitialAd(): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.isInterstitialLoaded && this.interstitialAd) {
        this.interstitialAd.show();
        resolve(true);
      } else {
        console.log('Interstitial ad not ready');
        resolve(false);
      }
    });
  }

  // 初始化獎勵廣告
  static initializeRewardedAd() {
    this.rewardedAd = RewardedAd.createForAdRequest(this.AD_UNIT_IDS.REWARDED, {
      requestNonPersonalizedAdsOnly: true,
    });

    this.rewardedAd.addAdEventListener(RewardedAdEventType.LOADED, () => {
      this.isRewardedLoaded = true;
      console.log('Rewarded ad loaded');
    });

    this.rewardedAd.addAdEventListener(AdEventType.ERROR, (error) => {
      console.error('Rewarded ad error:', error);
      this.isRewardedLoaded = false;
    });

    this.rewardedAd.addAdEventListener(RewardedAdEventType.EARNED_REWARD, (reward) => {
      console.log('User earned reward:', reward);
    });

    this.rewardedAd.addAdEventListener(AdEventType.CLOSED, () => {
      this.isRewardedLoaded = false;
      // 重新載入下一個廣告
      this.loadRewardedAd();
    });

    this.loadRewardedAd();
  }

  // 載入獎勵廣告
  static loadRewardedAd() {
    if (this.rewardedAd) {
      this.rewardedAd.load();
    }
  }

  // 顯示獎勵廣告
  static showRewardedAd(): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.isRewardedLoaded && this.rewardedAd) {
        this.rewardedAd.show();
        resolve(true);
      } else {
        console.log('Rewarded ad not ready');
        resolve(false);
      }
    });
  }

  // 檢查廣告是否已載入
  static isInterstitialReady(): boolean {
    return this.isInterstitialLoaded;
  }

  static isRewardedReady(): boolean {
    return this.isRewardedLoaded;
  }

  // 初始化所有廣告
  static initialize() {
    this.initializeInterstitialAd();
    this.initializeRewardedAd();
    console.log('AdService initialized');
  }
} 