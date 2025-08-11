// Store 監控器 - 純觀察者模式
// 監控 Zustand store 狀態變化但絕不修改任何業務邏輯

import { monitor } from './SentryMonitor';
import { debugLog, isMonitoringEnabled } from './config';
import { safeMonitor } from './functionWrappers';

interface StoreState {
  sessions: any[];
  hands: any[];
  stats: any;
  isLocalMode: boolean;
  hasCheckedWelcomeData: boolean;
}

class StoreMonitor {
  private isInitialized = false;
  private previousState: Partial<StoreState> | null = null;

  // 初始化監控但不修改 store
  init(store: any) {
    if (this.isInitialized || !isMonitoringEnabled()) {
      return;
    }

    try {
      // 記錄初始狀態（不修改）
      const initialState = store.getState();
      this.previousState = {
        sessions: initialState.sessions || [],
        hands: initialState.hands || [],
        stats: initialState.stats || {},
        isLocalMode: initialState.isLocalMode,
        hasCheckedWelcomeData: initialState.hasCheckedWelcomeData,
      };

      // 被動訂閱狀態變化
      store.subscribe((newState: StoreState) => {
        safeMonitor(() => this.trackStateChange(newState));
      });

      this.isInitialized = true;

      safeMonitor(() => {
        monitor.safeTrack('store_monitor_initialized', {
          initialSessionCount: this.previousState?.sessions?.length || 0,
          initialHandCount: this.previousState?.hands?.length || 0,
          initialMode: this.previousState?.isLocalMode ? 'local' : 'api',
        });
      });

      debugLog('Store monitor initialized', {
        sessionCount: this.previousState?.sessions?.length || 0,
        handCount: this.previousState?.hands?.length || 0,
      });
    } catch (error) {
      debugLog('Failed to initialize store monitor', error);
    }
  }

  // 追蹤狀態變化（純觀察，不修改任何狀態）
  private trackStateChange(newState: StoreState) {
    if (!isMonitoringEnabled() || !this.previousState) {
      return;
    }

    try {
      // 檢測會話變化
      this.trackSessionChanges(newState);

      // 檢測手牌變化
      this.trackHandChanges(newState);

      // 檢測模式變化
      this.trackModeChanges(newState);

      // 檢測統計變化
      this.trackStatsChanges(newState);

      // 更新上一次狀態（純記錄，不影響業務邏輯）
      this.previousState = {
        sessions: [...(newState.sessions || [])],
        hands: [...(newState.hands || [])],
        stats: { ...(newState.stats || {}) },
        isLocalMode: newState.isLocalMode,
        hasCheckedWelcomeData: newState.hasCheckedWelcomeData,
      };
    } catch (error) {
      debugLog('Failed to track state change', error);
    }
  }

  private trackSessionChanges(newState: StoreState) {
    if (!this.previousState) {return;}

    const prevCount = this.previousState.sessions?.length || 0;
    const newCount = newState.sessions?.length || 0;

    if (prevCount !== newCount) {
      const changeType = newCount > prevCount ? 'added' : 'removed';
      const changeAmount = Math.abs(newCount - prevCount);

      monitor.safeTrack(`sessions_${changeType}`, {
        previousCount: prevCount,
        newCount: newCount,
        changeAmount: changeAmount,
      });

      debugLog(`Sessions ${changeType}`, {
        prev: prevCount,
        new: newCount,
        change: changeAmount,
      });
    }
  }

  private trackHandChanges(newState: StoreState) {
    if (!this.previousState) {return;}

    const prevCount = this.previousState.hands?.length || 0;
    const newCount = newState.hands?.length || 0;

    if (prevCount !== newCount) {
      const changeType = newCount > prevCount ? 'added' : 'removed';
      const changeAmount = Math.abs(newCount - prevCount);

      monitor.safeTrack(`hands_${changeType}`, {
        previousCount: prevCount,
        newCount: newCount,
        changeAmount: changeAmount,
      });

      debugLog(`Hands ${changeType}`, {
        prev: prevCount,
        new: newCount,
        change: changeAmount,
      });
    }
  }

  private trackModeChanges(newState: StoreState) {
    if (!this.previousState) {return;}

    const prevMode = this.previousState.isLocalMode;
    const newMode = newState.isLocalMode;

    if (prevMode !== newMode) {
      monitor.safeTrack('storage_mode_changed', {
        previousMode: prevMode ? 'local' : 'api',
        newMode: newMode ? 'local' : 'api',
      });

      debugLog('Storage mode changed', {
        from: prevMode ? 'local' : 'api',
        to: newMode ? 'local' : 'api',
      });
    }
  }

  private trackStatsChanges(newState: StoreState) {
    if (!this.previousState || !this.previousState.stats || !newState.stats) {return;}

    try {
      const prevProfit = this.previousState.stats.totalProfit || 0;
      const newProfit = newState.stats.totalProfit || 0;

      if (prevProfit !== newProfit) {
        const profitChange = newProfit - prevProfit;

        monitor.safeTrack('stats_profit_changed', {
          previousProfit: prevProfit,
          newProfit: newProfit,
          profitChange: profitChange,
          changeType: profitChange > 0 ? 'gain' : 'loss',
        });

        debugLog('Profit stats changed', {
          prev: prevProfit,
          new: newProfit,
          change: profitChange,
        });
      }
    } catch (error) {
      debugLog('Failed to track stats changes', error);
    }
  }

  // 手動追蹤特定業務事件（不修改業務邏輯）
  trackBusinessEvent(eventName: string, eventData?: Record<string, any>) {
    safeMonitor(() => {
      monitor.safeTrack(`business_event:${eventName}`, {
        timestamp: Date.now(),
        ...eventData,
      });

      debugLog(`Business event: ${eventName}`, eventData);
    });
  }

  // 獲取當前監控狀態
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      hasState: !!this.previousState,
      sessionCount: this.previousState?.sessions?.length || 0,
      handCount: this.previousState?.hands?.length || 0,
      currentMode: this.previousState?.isLocalMode ? 'local' : 'api',
    };
  }
}

// 導出單例實例
export const storeMonitor = new StoreMonitor();
