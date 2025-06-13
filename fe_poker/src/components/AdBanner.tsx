import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ViewStyle, Text } from 'react-native';
import { BannerAd, BannerAdSize, AdEventType } from 'react-native-google-mobile-ads';
import adMobService from '../services/AdMobService';
import { theme } from '../theme';

interface AdBannerProps {
  size?: BannerAdSize;
  style?: ViewStyle;
  showTestLabel?: boolean;
}

export const AdBanner: React.FC<AdBannerProps> = ({ 
  size = BannerAdSize.BANNER,
  style,
  showTestLabel = __DEV__
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isAdMobReady, setIsAdMobReady] = useState(false);

  useEffect(() => {
    // 檢查 AdMob 是否已初始化
    const checkAdMobStatus = () => {
      setIsAdMobReady(adMobService.isReady());
    };

    checkAdMobStatus();
    
    // 如果 AdMob 還沒初始化，等待一段時間後再檢查
    if (!adMobService.isReady()) {
      const timer = setTimeout(checkAdMobStatus, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAdLoaded = () => {
    console.log('📱 Banner ad loaded successfully');
    setIsLoaded(true);
    setHasError(false);
  };

  const handleAdError = (error: any) => {
    console.error('❌ Banner ad error:', error);
    setHasError(true);
    setIsLoaded(false);
  };

  const handleAdOpened = () => {
    console.log('📱 Banner ad opened');
  };

  const handleAdClosed = () => {
    console.log('📱 Banner ad closed');
  };

  // 如果 AdMob 服務未準備好，顯示佔位符
  if (!isAdMobReady) {
    return (
      <View style={[styles.container, styles.placeholder, style]}>
        {showTestLabel && (
          <Text style={styles.placeholderText}>AdMob 初始化中...</Text>
        )}
      </View>
    );
  }

  // 如果有錯誤且在開發環境，顯示錯誤信息
  if (hasError && __DEV__) {
    return (
      <View style={[styles.container, styles.errorContainer, style]}>
        <Text style={styles.errorText}>廣告載入失敗</Text>
        {showTestLabel && (
          <Text style={styles.testLabel}>測試環境</Text>
        )}
      </View>
    );
  }

  // 如果有錯誤且在生產環境，不顯示任何內容
  if (hasError && !__DEV__) {
    return null;
  }

  try {
    return (
      <View style={[styles.container, style]}>
        {isAdMobReady ? (
          <BannerAd
            unitId={adMobService.getBannerAdUnitId()}
            size={size}
            requestOptions={{
              requestNonPersonalizedAdsOnly: false,
            }}
            onAdLoaded={handleAdLoaded}
            onAdFailedToLoad={handleAdError}
            onAdOpened={handleAdOpened}
            onAdClosed={handleAdClosed}
          />
        ) : (
          <View style={[styles.placeholder, { height: 50 }]}>
            <Text style={styles.placeholderText}>廣告載入中...</Text>
          </View>
        )}
        
        {/* 開發環境顯示測試標籤 */}
        {showTestLabel && __DEV__ && isAdMobReady && (
          <View style={styles.testLabelContainer}>
            <Text style={styles.testLabel}>測試廣告</Text>
          </View>
        )}
        
        {/* 載入狀態指示器 */}
        {isAdMobReady && !isLoaded && !hasError && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>載入中...</Text>
          </View>
        )}
      </View>
    );
  } catch (error) {
    console.error('❌ Banner ad render error:', error);
    
    // 在開發環境顯示錯誤
    if (__DEV__) {
      return (
        <View style={[styles.container, styles.errorContainer, style]}>
          <Text style={styles.errorText}>廣告組件錯誤</Text>
        </View>
      );
    }
    
    // 在生產環境顯示簡單佔位符
    return (
      <View style={[styles.container, styles.placeholder, style, { height: 50 }]}>
        <Text style={styles.placeholderText}>廣告</Text>
      </View>
    );
  }
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
  },
  placeholder: {
    height: 50,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.input,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontSize: theme.font.size.small,
    color: theme.colors.gray,
    fontFamily: theme.font.regular,
  },
  errorContainer: {
    height: 50,
    backgroundColor: theme.colors.loss + '10',
    borderRadius: theme.radius.input,
    borderWidth: 1,
    borderColor: theme.colors.loss + '30',
  },
  errorText: {
    fontSize: theme.font.size.small,
    color: theme.colors.loss,
    fontFamily: theme.font.regular,
  },
  testLabelContainer: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: theme.colors.primary + '20',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
  },
  testLabel: {
    fontSize: 10,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.card + '80',
  },
  loadingText: {
    fontSize: theme.font.size.small,
    color: theme.colors.gray,
    fontFamily: theme.font.regular,
  },
});

export default AdBanner; 