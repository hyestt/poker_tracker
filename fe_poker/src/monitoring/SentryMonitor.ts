// Sentry 監控服務 - 完全獨立，失敗不影響主功能
import * as Sentry from '@sentry/react-native';
import { isMonitoringEnabled, debugLog } from './config';

class SentryMonitor {
  private isEnabled = false;
  private isInitialized = false;

  // 安全初始化 - 任何錯誤都不會影響 app
  init(dsn?: string) {
    if (this.isInitialized) {
      debugLog('Sentry already initialized');
      return;
    }

    try {
      if (!isMonitoringEnabled()) {
        debugLog('Monitoring disabled by config');
        return;
      }

      // 如果沒有提供 DSN，使用測試模式
      const sentryDsn = dsn || 'YOUR_SENTRY_DSN_HERE';
      
      if (!dsn || dsn === 'YOUR_SENTRY_DSN_HERE') {
        debugLog('No valid Sentry DSN provided, running in test mode');
        this.isEnabled = false;
        this.isInitialized = true;
        return;
      }

      Sentry.init({
        dsn: sentryDsn,
        debug: __DEV__,
        // 基本配置，避免複雜功能影響 app 穩定性
        enableAutoSessionTracking: false,
        beforeSend(event) {
          // 最後的安全檢查 - 可以在這裡過濾敏感資訊
          if (!isMonitoringEnabled()) {
            debugLog('Event blocked by runtime check');
            return null;
          }
          return event;
        },
      });

      this.isEnabled = true;
      this.isInitialized = true;
      debugLog('Sentry initialized successfully');
    } catch (error) {
      // 監控系統初始化失敗不應該影響 app
      console.log('Sentry init failed, continuing without monitoring:', error);
      this.isEnabled = false;
      this.isInitialized = true;
    }
  }

  // 安全錯誤捕捉 - 失敗不影響主功能
  safeCapture(error: Error, context?: Record<string, any>) {
    try {
      if (!this.isEnabled || !isMonitoringEnabled()) {
        debugLog('Error not captured - monitoring disabled', { error: error.message });
        return;
      }

      // 設置上下文資訊
      if (context) {
        Sentry.withScope((scope) => {
          Object.keys(context).forEach((key) => {
            scope.setExtra(key, context[key]);
          });
          Sentry.captureException(error);
        });
      } else {
        Sentry.captureException(error);
      }

      debugLog('Error captured', { message: error.message, context });
    } catch (monitoringError) {
      // 監控錯誤絕對不能影響主功能
      debugLog('Failed to capture error', monitoringError);
    }
  }

  // 安全事件追蹤
  safeTrack(eventName: string, data?: Record<string, any>) {
    try {
      if (!this.isEnabled || !isMonitoringEnabled()) {
        debugLog(`Event not tracked - monitoring disabled: ${eventName}`, data);
        return;
      }

      Sentry.addBreadcrumb({
        message: eventName,
        data: data || {},
        level: 'info',
        timestamp: Date.now() / 1000,
      });

      debugLog(`Event tracked: ${eventName}`, data);
    } catch (monitoringError) {
      // 靜默失敗，不影響主功能
      debugLog('Failed to track event', monitoringError);
    }
  }

  // 設置用戶上下文
  safeSetUser(userInfo: { id?: string; isPremium?: boolean; mode?: string }) {
    try {
      if (!this.isEnabled || !isMonitoringEnabled()) {
        return;
      }

      Sentry.setUser({
        id: userInfo.id || 'anonymous',
        ...userInfo,
      });

      debugLog('User context set', userInfo);
    } catch (error) {
      debugLog('Failed to set user context', error);
    }
  }

  // 設置應用上下文
  safeSetContext(contextName: string, contextData: Record<string, any>) {
    try {
      if (!this.isEnabled || !isMonitoringEnabled()) {
        return;
      }

      Sentry.setContext(contextName, contextData);
      debugLog(`Context set: ${contextName}`, contextData);
    } catch (error) {
      debugLog('Failed to set context', error);
    }
  }

  // 開始性能監控事務（簡化版本，避免複雜的 transaction API）
  safeStartTransaction(name: string, operation?: string) {
    try {
      if (!this.isEnabled || !isMonitoringEnabled()) {
        // 返回一個空的事務對象，避免調用處需要檢查
        return {
          setData: () => {},
          setStatus: () => {},
          finish: () => {},
        };
      }

      // 使用簡化的 breadcrumb 記錄代替複雜的 transaction
      const startTime = Date.now();
      
      this.safeTrack(`transaction_start:${name}`, { 
        operation: operation || 'function',
        startTime 
      });

      debugLog(`Transaction started: ${name}`, { operation });
      
      return {
        setData: (data: Record<string, any>) => {
          this.safeTrack(`transaction_data:${name}`, data);
        },
        setStatus: (status: string) => {
          this.safeTrack(`transaction_status:${name}`, { status });
        },
        finish: () => {
          const duration = Date.now() - startTime;
          this.safeTrack(`transaction_finish:${name}`, { 
            duration,
            operation: operation || 'function' 
          });
        },
      };
    } catch (error) {
      debugLog('Failed to start transaction', error);
      // 返回空對象避免調用處錯誤
      return {
        setData: () => {},
        setStatus: () => {},
        finish: () => {},
      };
    }
  }

  // 獲取監控狀態（用於調試）
  getStatus() {
    return {
      isEnabled: this.isEnabled,
      isInitialized: this.isInitialized,
      configEnabled: isMonitoringEnabled(),
    };
  }
}

// 導出單例實例
export const monitor = new SentryMonitor();