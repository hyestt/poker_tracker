// 監控初始化模組 - 安全啟動監控系統
// 只在 App.tsx 中調用一次，確保不影響現有功能

import { monitor } from './SentryMonitor';
import { storeMonitor } from './storeMonitor';
import { useSessionStore } from '../viewmodels/sessionStore';

// 初始化監控系統（安全模式）
export const initializeMonitoring = (dsn?: string) => {
  try {
    // 1. 初始化 Sentry 監控
    monitor.init(dsn);
    
    // 2. 初始化 Store 監控
    const store = useSessionStore;
    storeMonitor.init(store);
    
    // 3. 設置基本上下文
    monitor.safeSetContext('app', {
      version: require('../../package.json').version || 'unknown',
      platform: 'react-native',
      environment: __DEV__ ? 'development' : 'production',
    });
    
    // 4. 記錄監控系統啟動
    monitor.safeTrack('monitoring_system_initialized', {
      sentryStatus: monitor.getStatus(),
      storeStatus: storeMonitor.getStatus(),
    });
    
    console.log('📊 Monitoring system initialized safely');
    return true;
  } catch (error) {
    // 監控系統初始化失敗不應該影響 app 啟動
    console.log('⚠️ Monitoring initialization failed, app will continue normally:', error);
    return false;
  }
};

// 檢查監控狀態（用於調試）
export const getMonitoringStatus = () => {
  try {
    return {
      sentry: monitor.getStatus(),
      store: storeMonitor.getStatus(),
    };
  } catch (error) {
    return {
      error: 'Failed to get monitoring status',
      details: error,
    };
  }
};