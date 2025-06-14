import firebase from '@react-native-firebase/app';
import analytics from '@react-native-firebase/analytics';

// Firebase配置
const firebaseConfig = {
  // 注意：這些是示例配置，需要替換為你的實際Firebase項目配置
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:ios:abcdef123456",
  measurementId: "G-XXXXXXXXXX"
};

// 初始化Firebase (如果還沒有初始化)
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Analytics實例
export const firebaseAnalytics = analytics();

// Analytics輔助函數
export const logEvent = (eventName: string, parameters?: { [key: string]: any }) => {
  try {
    firebaseAnalytics.logEvent(eventName, parameters);
    console.log(`📊 Analytics Event: ${eventName}`, parameters);
  } catch (error) {
    console.error('Analytics error:', error);
  }
};

// 設置用戶屬性
export const setUserProperty = (name: string, value: string) => {
  try {
    firebaseAnalytics.setUserProperty(name, value);
    console.log(`👤 User Property: ${name} = ${value}`);
  } catch (error) {
    console.error('User property error:', error);
  }
};

// 設置用戶ID
export const setUserId = (userId: string) => {
  try {
    firebaseAnalytics.setUserId(userId);
    console.log(`🆔 User ID: ${userId}`);
  } catch (error) {
    console.error('User ID error:', error);
  }
};

// 撲克相關的Analytics事件
export const PokerAnalytics = {
  // 遊戲場次事件
  sessionStarted: (sessionData: {
    location: string;
    tableSize: number;
    blinds: string;
    currency: string;
  }) => {
    logEvent('poker_session_started', {
      location: sessionData.location,
      table_size: sessionData.tableSize,
      blinds: sessionData.blinds,
      currency: sessionData.currency,
    });
  },

  sessionEnded: (sessionData: {
    duration: number;
    handsPlayed: number;
    profit: number;
    currency: string;
  }) => {
    logEvent('poker_session_ended', {
      session_duration: sessionData.duration,
      hands_played: sessionData.handsPlayed,
      profit: sessionData.profit,
      currency: sessionData.currency,
    });
  },

  // 手牌事件
  handAdded: (handData: {
    position: string;
    result: number;
    hasAnalysis: boolean;
  }) => {
    logEvent('poker_hand_added', {
      position: handData.position,
      result: handData.result,
      has_analysis: handData.hasAnalysis,
    });
  },

  handAnalyzed: (analysisData: {
    handId: string;
    analysisType: 'ai' | 'manual';
  }) => {
    logEvent('poker_hand_analyzed', {
      hand_id: analysisData.handId,
      analysis_type: analysisData.analysisType,
    });
  },

  // 應用使用事件
  screenViewed: (screenName: string) => {
    logEvent('screen_view', {
      screen_name: screenName,
      screen_class: screenName,
    });
  },

  featureUsed: (featureName: string, details?: { [key: string]: any }) => {
    logEvent('feature_used', {
      feature_name: featureName,
      ...details,
    });
  },

  // 統計查看事件
  statsViewed: (statsType: string, timeRange?: string) => {
    logEvent('stats_viewed', {
      stats_type: statsType,
      time_range: timeRange || 'all_time',
    });
  },
};

export default firebaseAnalytics; 