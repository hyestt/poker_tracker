// 監控功能開關配置
// 緊急情況下可以即時關閉所有監控功能

export const MONITORING_FLAGS = {
  // 主開關 - 可通過環境變數控制
  ENABLED: process.env.MONITORING_ENABLED !== 'false',
  
  // 緊急關閉開關 - 用於生產環境緊急狀況
  EMERGENCY_DISABLE: process.env.EMERGENCY_DISABLE_MONITORING === 'true',
  
  // 開發模式下的詳細日誌
  DEBUG_MODE: __DEV__ && process.env.MONITORING_DEBUG === 'true',
  
  // 個別功能開關
  ERROR_TRACKING: process.env.DISABLE_SENTRY_ERRORS !== 'true',
  PERFORMANCE_TRACKING: process.env.DISABLE_SENTRY_PERFORMANCE !== 'true',
  BREADCRUMBS: process.env.DISABLE_SENTRY_BREADCRUMBS !== 'true',
};

// 運行時檢查監控是否應該啟用
export const isMonitoringEnabled = (): boolean => {
  return MONITORING_FLAGS.ENABLED && !MONITORING_FLAGS.EMERGENCY_DISABLE;
};

// 開發模式日誌輔助函數
export const debugLog = (message: string, data?: any) => {
  if (MONITORING_FLAGS.DEBUG_MODE) {
    console.log(`[Monitoring] ${message}`, data || '');
  }
};