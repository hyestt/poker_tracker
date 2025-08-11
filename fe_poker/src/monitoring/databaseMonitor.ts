// 資料庫監控器 - 純觀察者模式
// 監控 DatabaseService 操作但絕不修改原始功能

import { DatabaseService } from '../services/DatabaseService';
import { monitor } from './SentryMonitor';
import { withDatabaseMonitoring, safeMonitor } from './functionWrappers';
import { debugLog, isMonitoringEnabled } from './config';
import { Session, Hand, Stats } from '../models';

class DatabaseMonitor {
  private static instance: DatabaseMonitor | null = null;
  private isInitialized = false;

  // 單例模式
  static getInstance(): DatabaseMonitor {
    if (!DatabaseMonitor.instance) {
      DatabaseMonitor.instance = new DatabaseMonitor();
    }
    return DatabaseMonitor.instance;
  }

  // 初始化監控（不修改原始 DatabaseService）
  init() {
    if (this.isInitialized || !isMonitoringEnabled()) {
      return;
    }

    try {
      safeMonitor(() => {
        monitor.safeTrack('database_monitor_initialized');
        debugLog('Database monitor initialized');
      });

      this.isInitialized = true;
    } catch (error) {
      debugLog('Failed to initialize database monitor', error);
    }
  }

  // 創建監控版本的方法（不替換原始方法）
  createMonitoredMethods() {
    if (!isMonitoringEnabled()) {
      // 如果監控被禁用，返回原始方法
      return DatabaseService;
    }

    // 創建包裝版本，但不修改原始 DatabaseService
    const monitoredMethods = {
      // 包裝 Session 相關方法
      getAllSessions: withDatabaseMonitoring(
        DatabaseService.getAllSessions.bind(DatabaseService),
        'getAllSessions'
      ),

      getSession: withDatabaseMonitoring(
        DatabaseService.getSession.bind(DatabaseService),
        'getSession'
      ),

      insertSession: withDatabaseMonitoring(
        DatabaseService.insertSession.bind(DatabaseService),
        'insertSession'
      ),

      updateSession: withDatabaseMonitoring(
        DatabaseService.updateSession.bind(DatabaseService),
        'updateSession'
      ),

      deleteSession: withDatabaseMonitoring(
        DatabaseService.deleteSession.bind(DatabaseService),
        'deleteSession'
      ),

      // 包裝 Hand 相關方法
      getAllHands: withDatabaseMonitoring(
        DatabaseService.getAllHands.bind(DatabaseService),
        'getAllHands'
      ),

      getHand: withDatabaseMonitoring(
        DatabaseService.getHand.bind(DatabaseService),
        'getHand'
      ),

      insertHand: withDatabaseMonitoring(
        DatabaseService.insertHand.bind(DatabaseService),
        'insertHand'
      ),

      updateHand: withDatabaseMonitoring(
        DatabaseService.updateHand.bind(DatabaseService),
        'updateHand'
      ),

      deleteHand: withDatabaseMonitoring(
        DatabaseService.deleteHand.bind(DatabaseService),
        'deleteHand'
      ),

      getHandsBySession: withDatabaseMonitoring(
        DatabaseService.getHandsBySession.bind(DatabaseService),
        'getHandsBySession'
      ),

      // 包裝統計方法
      getStats: withDatabaseMonitoring(
        DatabaseService.getStats.bind(DatabaseService),
        'getStats'
      ),

      // 包裝批次操作
      batchInsertSessions: withDatabaseMonitoring(
        DatabaseService.batchInsertSessions.bind(DatabaseService),
        'batchInsertSessions'
      ),

      batchInsertHands: withDatabaseMonitoring(
        DatabaseService.batchInsertHands.bind(DatabaseService),
        'batchInsertHands'
      ),

      // 包裝管理方法
      initialize: withDatabaseMonitoring(
        DatabaseService.initialize.bind(DatabaseService),
        'initialize'
      ),

      clearAllData: withDatabaseMonitoring(
        DatabaseService.clearAllData.bind(DatabaseService),
        'clearAllData'
      ),

      getDataStats: withDatabaseMonitoring(
        DatabaseService.getDataStats.bind(DatabaseService),
        'getDataStats'
      ),

      close: withDatabaseMonitoring(
        DatabaseService.close.bind(DatabaseService),
        'close'
      ),
    };

    return monitoredMethods;
  }

  // 手動記錄資料庫事件（不影響業務邏輯）
  trackDatabaseEvent(
    operation: string, 
    data?: { 
      recordCount?: number; 
      tableName?: string; 
      success?: boolean;
      error?: string;
    }
  ) {
    safeMonitor(() => {
      monitor.safeTrack(`database_operation:${operation}`, {
        operation,
        timestamp: Date.now(),
        ...data,
      });

      debugLog(`Database operation: ${operation}`, data);
    });
  }

  // 記錄資料庫錯誤（不改變錯誤處理）
  trackDatabaseError(operation: string, error: Error, context?: any) {
    safeMonitor(() => {
      monitor.safeCapture(error, {
        operation: `database_${operation}`,
        context: context || {},
        timestamp: Date.now(),
      });

      debugLog(`Database error in ${operation}`, { 
        error: error.message, 
        context 
      });
    });
  }

  // 記錄資料庫性能指標
  trackDatabasePerformance(
    operation: string, 
    duration: number, 
    recordCount?: number
  ) {
    safeMonitor(() => {
      monitor.safeTrack(`database_performance:${operation}`, {
        operation,
        duration,
        recordCount,
        timestamp: Date.now(),
      });

      if (duration > 1000) { // 超過1秒的操作
        debugLog(`Slow database operation: ${operation}`, { 
          duration, 
          recordCount 
        });
      }
    });
  }

  // 獲取監控狀態
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      monitoringEnabled: isMonitoringEnabled(),
      canCreateMonitoredMethods: this.isInitialized && isMonitoringEnabled(),
    };
  }
}

// 導出單例實例
export const databaseMonitor = DatabaseMonitor.getInstance();

// 便利函數：創建監控版本的 DatabaseService
export const createMonitoredDatabaseService = () => {
  databaseMonitor.init();
  return databaseMonitor.createMonitoredMethods();
};

// 便利函數：直接使用原始 DatabaseService（用於關鍵路徑）
export const getOriginalDatabaseService = () => {
  return DatabaseService;
};