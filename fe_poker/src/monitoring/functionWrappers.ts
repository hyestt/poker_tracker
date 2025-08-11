// 函數監控包裝器 - 純觀察者模式
// 包裝函數進行監控但絕不改變其行為或回傳值

import { monitor } from './SentryMonitor';
import { debugLog } from './config';

// 通用的函數監控包裝器
export function withMonitoring<T extends (...args: any[]) => any>(
  originalFunction: T,
  functionName: string,
  options: {
    trackArgs?: boolean;
    trackResult?: boolean;
    trackTiming?: boolean;
  } = {}
): T {
  return ((...args: any[]) => {
    const startTime = options.trackTiming ? Date.now() : 0;

    // 記錄函數調用（不影響執行）
    try {
      const trackingData: Record<string, any> = {
        function: functionName,
      };

      if (options.trackArgs) {
        trackingData.argsCount = args.length;
        // 不記錄實際參數內容，避免敏感資訊洩露
      }

      monitor.safeTrack(`function_called:${functionName}`, trackingData);
      debugLog(`Function called: ${functionName}`, trackingData);
    } catch (monitoringError) {
      // 監控失敗不影響函數執行
      debugLog('Monitoring function call failed', monitoringError);
    }

    try {
      // 執行原始函數 - 完全不修改任何行為
      const result = originalFunction(...args);

      // 如果是 Promise，監控其結果
      if (result instanceof Promise) {
        // 創建新的 Promise 包裝原始結果，但不改變結果
        return result
          .then((promiseResult) => {
            try {
              // 記錄成功結果
              const successData: Record<string, any> = {
                function: functionName,
                timing: options.trackTiming ? Date.now() - startTime : undefined,
              };

              if (options.trackResult && promiseResult !== undefined) {
                successData.hasResult = true;
                // 不記錄實際結果內容，避免敏感資訊
              }

              monitor.safeTrack(`function_success:${functionName}`, successData);
              debugLog(`Function succeeded: ${functionName}`, successData);
            } catch (monitoringError) {
              debugLog('Monitoring function success failed', monitoringError);
            }

            // 回傳原始結果 - 完全不修改
            return promiseResult;
          })
          .catch((error) => {
            try {
              // 記錄錯誤但不改變錯誤處理
              monitor.safeCapture(error, {
                function: functionName,
                timing: options.trackTiming ? Date.now() - startTime : undefined,
              });
              debugLog(`Function failed: ${functionName}`, { error: error.message });
            } catch (monitoringError) {
              debugLog('Monitoring function error failed', monitoringError);
            }

            // 重新拋出原始錯誤 - 不改變錯誤處理
            throw error;
          });
      } else {
        // 同步函數成功
        try {
          const successData: Record<string, any> = {
            function: functionName,
            timing: options.trackTiming ? Date.now() - startTime : undefined,
          };

          if (options.trackResult && result !== undefined) {
            successData.hasResult = true;
          }

          monitor.safeTrack(`function_success:${functionName}`, successData);
          debugLog(`Function succeeded: ${functionName}`, successData);
        } catch (monitoringError) {
          debugLog('Monitoring function success failed', monitoringError);
        }

        // 回傳原始結果 - 完全不修改
        return result;
      }
    } catch (error) {
      try {
        // 記錄錯誤但不影響錯誤傳播
        monitor.safeCapture(error as Error, {
          function: functionName,
          timing: options.trackTiming ? Date.now() - startTime : undefined,
        });
        debugLog(`Function failed: ${functionName}`, { error: (error as Error).message });
      } catch (monitoringError) {
        debugLog('Monitoring function error failed', monitoringError);
      }

      // 重新拋出原始錯誤 - 不改變錯誤處理
      throw error;
    }
  }) as T;
}

// 專用於 async 函數的包裝器
export function withAsyncMonitoring<T extends (...args: any[]) => Promise<any>>(
  originalFunction: T,
  functionName: string
): T {
  return withMonitoring(originalFunction, functionName, {
    trackTiming: true,
    trackResult: true,
  }) as T;
}

// 專用於資料庫操作的包裝器
export function withDatabaseMonitoring<T extends (...args: any[]) => any>(
  originalFunction: T,
  operationName: string
): T {
  return withMonitoring(originalFunction, `database_${operationName}`, {
    trackTiming: true,
    trackArgs: false, // 資料庫參數可能包含敏感資訊
    trackResult: false, // 資料庫結果可能包含敏感資訊
  }) as T;
}

// 專用於 API 調用的包裝器
export function withAPIMonitoring<T extends (...args: any[]) => Promise<any>>(
  originalFunction: T,
  apiName: string
): T {
  return ((...args: any[]) => {
    const transaction = monitor.safeStartTransaction(`api_call_${apiName}`, 'http');

    try {
      const result = originalFunction(...args);

      if (result instanceof Promise) {
        return result
          .then((response) => {
            try {
              transaction.setStatus('ok');
              transaction.finish();
              monitor.safeTrack(`api_success:${apiName}`);
            } catch (monitoringError) {
              debugLog('API monitoring success failed', monitoringError);
            }
            return response;
          })
          .catch((error) => {
            try {
              transaction.setStatus('internal_error');
              transaction.finish();
              monitor.safeCapture(error, { api: apiName });
            } catch (monitoringError) {
              debugLog('API monitoring error failed', monitoringError);
            }
            throw error;
          });
      } else {
        transaction.finish();
        return result;
      }
    } catch (error) {
      try {
        transaction.setStatus('internal_error');
        transaction.finish();
        monitor.safeCapture(error as Error, { api: apiName });
      } catch (monitoringError) {
        debugLog('API monitoring sync error failed', monitoringError);
      }
      throw error;
    }
  }) as T;
}

// 安全的監控輔助函數
export const safeMonitor = (operation: () => void) => {
  try {
    operation();
  } catch (error) {
    // 監控操作失敗絕不影響主功能
    debugLog('Monitoring operation failed, continuing normally', error);
  }
};
