// 監控模組的主要導出
// 遵循純觀察者模式：只觀察，絕不影響業務邏輯

// 核心監控服務
export { monitor } from './SentryMonitor';
export { storeMonitor } from './storeMonitor';
export { databaseMonitor, createMonitoredDatabaseService } from './databaseMonitor';

// 包裝器和工具
export { withMonitoring, withAsyncMonitoring, withDatabaseMonitoring, withAPIMonitoring, safeMonitor } from './functionWrappers';

// 配置和初始化
export { MONITORING_FLAGS, isMonitoringEnabled, debugLog } from './config';
export { initializeMonitoring, getMonitoringStatus } from './initializeMonitoring';