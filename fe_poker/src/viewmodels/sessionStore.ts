import { create } from 'zustand';
import { Session, Hand, Stats } from '../models';
import { API_BASE_URL } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DatabaseService } from '../services/DatabaseService';
// import RevenueCatService from '../services/RevenueCatService'; // Removed as not used in store
import { WelcomeDemoService } from '../services/WelcomeDemoService';
// 監控模組 - 純觀察者模式，不影響業務邏輯
import { monitor } from '../monitoring/SentryMonitor';

// 簡單的 UUID 生成函數
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

interface State {
  sessions: Session[];
  hands: Hand[];
  stats: Stats;
  isLocalMode: boolean; // 是否使用本地模式
  hasCheckedWelcomeData: boolean; // 是否已經檢查過歡迎數據
  fetchSessions: () => Promise<void>;
  addSession: (session: Session) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  fetchHands: () => Promise<void>;
  addHand: (hand: Hand) => Promise<void>;
  deleteHand: (id: string) => Promise<void>;
  analyzeHand: (id: string) => Promise<string>;
  toggleFavorite: (id: string) => Promise<boolean>;
  fetchStats: () => Promise<void>;
  getHandsBySession: (sessionId: string) => Hand[];
  getHand: (id: string) => Promise<Hand>;
  updateHand: (hand: Hand) => Promise<void>;
  getSession: (id: string) => Promise<Session>;
  updateSession: (session: Session) => Promise<void>;
  // 新增的混合模式方法
  switchToLocalMode: () => Promise<void>;
  switchToApiMode: () => Promise<void>;
  migrateToLocal: () => Promise<void>;
  // 新增的初始化方法
  initialize: () => Promise<void>;
  checkAndCreateWelcomeData: () => Promise<void>;
  // Tags相關方法
  getAllUsedTags: () => string[];
  // End session method
  endSession: (sessionId: string, cashOut: number, cashOutTime: string) => Promise<void>;
}

// API 調用輔助函數
const apiCall = async (url: string, options?: RequestInit) => {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  // 檢查響應是否有內容
  const text = await response.text();
  if (!text) {
    return null; // 空響應返回 null
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    console.error('JSON Parse error:', error, 'Response text:', text);
    throw new Error('Invalid JSON response');
  }
};

export const useSessionStore = create<State>((set, get) => ({
  sessions: [],
  hands: [],
  stats: {
    totalProfit: 0,
    totalSessions: 0,
    winRate: 0,
    avgSession: 0,
    byStakes: {},
    byLocation: {},
  },
  isLocalMode: true, // 預設使用本地模式
  hasCheckedWelcomeData: false, // 預設尚未檢查歡迎數據

  // ==================== 初始化 ====================

  initialize: async () => {
    try {
      // 監控：應用初始化開始
      monitor.safeTrack('app_initialization_started');

      // 檢查儲存的模式設定，預設使用本地模式
      const savedMode = await AsyncStorage.getItem('poker_storage_mode');
      if (savedMode === 'api') {
        set({ isLocalMode: false });
        console.log('🔄 使用 API 模式');
      } else {
        set({ isLocalMode: true });
        console.log('🔄 使用本地模式設定');
      }

      // 監控：記錄初始化模式
      monitor.safeTrack('app_mode_initialized', {
        mode: savedMode === 'api' ? 'api' : 'local',
      });

      // 檢查是否首次啟動並創建歡迎範例數據
      await get().checkAndCreateWelcomeData();

      // 載入資料
      await get().fetchSessions();
      await get().fetchHands();
      await get().fetchStats();

      // 監控：應用初始化成功
      monitor.safeTrack('app_initialization_completed');
    } catch (error) {
      console.error('初始化失敗:', error);
      // 監控：記錄初始化錯誤但不影響錯誤處理
      monitor.safeCapture(error as Error, { operation: 'app_initialization' });

      // 如果初始化失敗，確保使用本地模式
      set({ isLocalMode: true });
      await get().fetchSessions();
      await get().fetchHands();
      await get().fetchStats();
    }
  },

  // ==================== SESSIONS ====================

  fetchSessions: async () => {
    const { isLocalMode } = get();

    try {
      // 監控：開始獲取會話數據
      monitor.safeTrack('fetch_sessions_started', { mode: isLocalMode ? 'local' : 'api' });

      if (isLocalMode) {
        // 使用本地 SQLite
        await DatabaseService.initialize();
        const sessions = await DatabaseService.getAllSessions();
        set({ sessions });
        await AsyncStorage.setItem('poker_sessions', JSON.stringify(sessions));

        // 監控：記錄本地獲取成功
        monitor.safeTrack('fetch_sessions_success_local', { count: sessions.length });
      } else {
        // 使用 API
        const data = await apiCall(`${API_BASE_URL}/sessions`);

        const sessions: Session[] = (data || []).map((session: any) => ({
          id: session.id,
          location: session.location || '',
          date: session.date || '',
          smallBlind: session.smallBlind || 0,
          bigBlind: session.bigBlind || 0,
          currency: session.currency || '',
          effectiveStack: session.effectiveStack || 0,
          tableSize: session.tableSize || 6,
          tag: session.tag || '',
          createdAt: session.createdAt,
          updatedAt: session.updatedAt,
        }));

        set({ sessions });
        await AsyncStorage.setItem('poker_sessions', JSON.stringify(sessions));

        // 監控：記錄 API 獲取成功
        monitor.safeTrack('fetch_sessions_success_api', { count: sessions.length });
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
      // 監控：記錄獲取失敗但不影響錯誤處理
      monitor.safeCapture(error as Error, {
        operation: 'fetch_sessions',
        mode: isLocalMode ? 'local' : 'api',
      });

      const cached = await AsyncStorage.getItem('poker_sessions');
      if (cached) {
        set({ sessions: JSON.parse(cached) });
        // 監控：記錄回退到快取數據
        monitor.safeTrack('fetch_sessions_fallback_to_cache', {
          hasCachedData: true,
        });
      }
    }
  },

  addSession: async (session: Session) => {
    const { isLocalMode } = get();

    try {
      // 監控：開始添加會話
      monitor.safeTrack('add_session_started', {
        mode: isLocalMode ? 'local' : 'api',
        location: session.location || 'unknown',
      });

      // 確保有 ID
      if (!session.id) {
        session.id = generateUUID();
      }

      // 確保必填欄位有預設值
      const sessionData = {
        ...session,
        tableSize: session.tableSize || 6,
        tag: session.tag || '',
      };

      if (isLocalMode) {
        // 使用本地 SQLite
        await DatabaseService.initialize();
        await DatabaseService.insertSession(sessionData);
      } else {
        // 使用 API
        await apiCall(`${API_BASE_URL}/sessions`, {
          method: 'POST',
          body: JSON.stringify(sessionData),
        });
      }

      await get().fetchSessions();

      // 監控：添加會話成功
      monitor.safeTrack('add_session_success', {
        mode: isLocalMode ? 'local' : 'api',
        sessionId: sessionData.id,
      });
    } catch (error) {
      console.error('Error adding session:', error);
      // 監控：記錄添加會話錯誤但不影響錯誤處理
      monitor.safeCapture(error as Error, {
        operation: 'add_session',
        mode: isLocalMode ? 'local' : 'api',
      });
      throw error;
    }
  },

  deleteSession: async (id: string) => {
    const { isLocalMode } = get();

    try {
      if (isLocalMode) {
        // 使用本地 SQLite
        await DatabaseService.initialize();
        await DatabaseService.deleteSession(id);
      } else {
        // 使用 API
        await apiCall(`${API_BASE_URL}/sessions?id=${id}`, {
          method: 'DELETE',
        });
      }

      await get().fetchSessions();
    } catch (error) {
      console.error('Error deleting session:', error);
      throw error;
    }
  },

  getSession: async (id: string): Promise<Session> => {
    const { isLocalMode } = get();

    try {
      if (isLocalMode) {
        // 使用本地 SQLite
        await DatabaseService.initialize();
        const session = await DatabaseService.getSession(id);
        if (!session) {
          throw new Error('Session not found');
        }
        return session;
      } else {
        // 使用 API
        const data = await apiCall(`${API_BASE_URL}/session?id=${id}`);

        if (!data) {
          throw new Error('Session not found');
        }

        return {
          id: data.id,
          location: data.location || '',
          date: data.date || '',
          smallBlind: data.smallBlind || 0,
          bigBlind: data.bigBlind || 0,
          currency: data.currency || '',
          effectiveStack: data.effectiveStack || 0,
          tableSize: data.tableSize || 6,
          tag: data.tag || '',
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        };
      }
    } catch (error) {
      console.error('Error getting session:', error);
      throw error;
    }
  },

  updateSession: async (session: Session) => {
    const { isLocalMode } = get();

    try {
      // 確保所有欄位都正確傳送
      const sessionData = {
        ...session,
        tableSize: session.tableSize || 6,
        tag: session.tag || '',
      };

      if (isLocalMode) {
        // 使用本地 SQLite
        await DatabaseService.initialize();
        await DatabaseService.updateSession(sessionData);
      } else {
        // 使用 API
        await apiCall(`${API_BASE_URL}/session?id=${session.id}`, {
          method: 'PUT',
          body: JSON.stringify(sessionData),
        });
      }

      await get().fetchSessions();
      await get().fetchStats();
    } catch (error) {
      console.error('Error updating session:', error);
      throw error;
    }
  },

  // ==================== HANDS ====================

  fetchHands: async () => {
    const { isLocalMode } = get();
    console.log('📥 fetchHands called, isLocalMode:', isLocalMode);

    try {
      if (isLocalMode) {
        // 使用本地 SQLite
        await DatabaseService.initialize();
        const hands = await DatabaseService.getAllHands();
        console.log('📊 Fetched hands from DB:', hands.length, 'hands');
        console.log('📊 Latest hands:', hands.slice(0, 3).map(h => ({ id: h.id, result: h.result, createdAt: h.createdAt, updatedAt: h.updatedAt })));
        set({ hands });
        await AsyncStorage.setItem('poker_hands', JSON.stringify(hands));
      } else {
        // 使用 API
        const data = await apiCall(`${API_BASE_URL}/hands`);

        const hands: Hand[] = (data || []).map((hand: any) => ({
          id: hand.id,
          sessionId: hand.sessionId || '',
          position: hand.position || '',
          holeCards: hand.holeCards || '',
          board: hand.board || '',
          details: hand.details || '',
          note: hand.note || '',
          result: hand.result || 0,
          analysis: hand.analysis || '',
          analysisDate: hand.analysisDate || '',
          favorite: hand.favorite || false,
          tag: hand.tag || '',
          villains: hand.villains || [],
          date: hand.date || '',
          createdAt: hand.createdAt,
          updatedAt: hand.updatedAt,
        }));

        set({ hands });
        await AsyncStorage.setItem('poker_hands', JSON.stringify(hands));
      }
    } catch (error) {
      console.error('Error fetching hands:', error);
      const cached = await AsyncStorage.getItem('poker_hands');
      if (cached) {
        set({ hands: JSON.parse(cached) });
      }
    }
  },

  addHand: async (hand: Hand) => {
    const { isLocalMode } = get();
    console.log('➕ addHand called with:', { id: hand.id, result: hand.result, sessionId: hand.sessionId });

    try {
      // 確保有 ID
      if (!hand.id) {
        hand.id = generateUUID();
      }

      // 確保必填欄位有預設值
      const handData = {
        ...hand,
        favorite: hand.favorite || false,
        result: hand.result || 0,
        villains: hand.villains || [],
      };

      console.log('💾 About to save hand:', { id: handData.id, result: handData.result, isLocalMode });

      if (isLocalMode) {
        // 使用本地 SQLite
        await DatabaseService.initialize();
        await DatabaseService.insertHand(handData);
        console.log('✅ Hand saved to local DB');
      } else {
        // 使用 API
        await apiCall(`${API_BASE_URL}/hands`, {
          method: 'POST',
          body: JSON.stringify(handData),
        });
        console.log('✅ Hand saved to API');
      }

      console.log('🔄 About to refresh hands data after addHand');
      await get().fetchHands();
      console.log('🔄 About to refresh stats after addHand');
      await get().fetchStats();
      console.log('✅ addHand completed successfully');
    } catch (error) {
      console.error('Error adding hand:', error);
      throw error;
    }
  },

  deleteHand: async (id: string) => {
    const { isLocalMode } = get();

    try {
      if (isLocalMode) {
        // 使用本地 SQLite
        await DatabaseService.initialize();
        await DatabaseService.deleteHand(id);
      } else {
        // 使用 API
        await apiCall(`${API_BASE_URL}/hands?id=${id}`, {
          method: 'DELETE',
        });
      }

      await get().fetchHands();
      await get().fetchStats();
    } catch (error) {
      console.error('Error deleting hand:', error);
      throw error;
    }
  },

  getHand: async (id: string): Promise<Hand> => {
    const { isLocalMode } = get();

    try {
      if (isLocalMode) {
        // 使用本地 SQLite
        await DatabaseService.initialize();
        const hand = await DatabaseService.getHand(id);
        if (!hand) {
          throw new Error('Hand not found');
        }
        return hand;
      } else {
        // 使用 API
        const data = await apiCall(`${API_BASE_URL}/hand?id=${id}`);

        if (!data) {
          throw new Error('Hand not found');
        }

        return {
          id: data.id,
          sessionId: data.sessionId || '',
          position: data.position || '',
          holeCards: data.holeCards || '',
          board: data.board || '',
          details: data.details || '',
          note: data.note || '',
          result: data.result || 0,
          analysis: data.analysis || '',
          analysisDate: data.analysisDate || '',
          favorite: data.favorite || false,
          tag: data.tag || '',
          villains: data.villains || [],
          date: data.date || '',
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        };
      }
    } catch (error) {
      console.error('Error getting hand:', error);
      throw error;
    }
  },

  updateHand: async (hand: Hand) => {
    const { isLocalMode } = get();

    try {
      // 確保所有欄位都正確傳送
      const handData = {
        ...hand,
        favorite: hand.favorite || false,
        result: hand.result || 0,
        villains: hand.villains || [],
      };

      if (isLocalMode) {
        // 使用本地 SQLite
        await DatabaseService.initialize();
        await DatabaseService.updateHand(handData);
      } else {
        // 使用 API
        await apiCall(`${API_BASE_URL}/hand?id=${hand.id}`, {
          method: 'PUT',
          body: JSON.stringify(handData),
        });
      }

      await get().fetchHands();
      await get().fetchStats();
    } catch (error) {
      console.error('Error updating hand:', error);
      throw error;
    }
  },

  // ==================== AI ANALYSIS (始終使用 API) ====================

  analyzeHand: async (id: string): Promise<string> => {
    try {
      // 首先從本地數據庫獲取手牌數據
      await DatabaseService.initialize();
      const hand = await DatabaseService.getHand(id);
      if (!hand) {
        throw new Error('Hand not found');
      }

      // 確保手牌有必要的分析數據，並轉換為後端期望的格式
      const handForAnalysis = {
        id: hand.id,
        sessionId: hand.sessionId,
        holeCards: hand.holeCards || null,
        board: hand.board || null,
        position: hand.position || null,
        details: hand.details || `${hand.holeCards || 'Unknown cards'} in ${hand.position || 'unknown'} position`,
        note: hand.note || null,
        result: hand.result || 0,
        date: hand.date || new Date().toISOString(),
        tag: hand.tag || '',
        villains: hand.villains || [],
        analysis: hand.analysis || '',
        analysisDate: hand.analysisDate || '',
        favorite: hand.favorite || false,
      };

      // AI Analysis 始終使用後端 API 進行分析
      try {
        const response = await apiCall(`${API_BASE_URL}/analyze`, {
          method: 'POST',
          body: JSON.stringify({ hand: handForAnalysis }),
        });

        // ⚠️ 重要：分析結果始終保存到本地 SQLite，不論任何模式
        if (hand && response?.analysis) {
          hand.analysis = response.analysis;
          hand.analysisDate = response.date || new Date().toISOString();
          await DatabaseService.updateHand(hand);
          console.log(`✅ AI分析結果已保存到本地SQLite: ${id}`);
        }

        await get().fetchHands();
        return response?.analysis || 'Analysis completed';
      } catch (apiError) {
        console.warn('API analysis failed:', apiError);

        // 如果API失敗，但手牌已有分析結果，則返回現有分析
        if (hand.analysis && hand.analysis.trim()) {
          console.log('✅ Returning existing analysis from database');
          return hand.analysis;
        }

        // 拋出更友好的錯誤訊息
        const errorMessage = apiError instanceof Error ? apiError.message : String(apiError);
        throw new Error(`Analysis failed: ${errorMessage}. Please check if the backend server is running and properly configured.`);
      }
    } catch (error) {
      console.error('Error analyzing hand:', error);
      throw error;
    }
  },

  // ==================== STATS ====================

  fetchStats: async () => {
    const { isLocalMode } = get();

    try {
      if (isLocalMode) {
        // 使用本地 SQLite 計算統計
        await DatabaseService.initialize();
        const stats = await DatabaseService.getStats();
        set({ stats });
      } else {
        // 使用 API
        const data = await apiCall(`${API_BASE_URL}/stats`);

        const stats: Stats = {
          totalProfit: data?.totalProfit || 0,
          totalSessions: data?.totalSessions || 0,
          winRate: data?.winRate || 0,
          avgSession: data?.avgSession || 0,
          byStakes: data?.byStakes || {},
          byLocation: data?.byLocation || {},
        };

        set({ stats });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      set({
        stats: {
          totalProfit: 0,
          totalSessions: 0,
          winRate: 0,
          avgSession: 0,
          byStakes: {},
          byLocation: {},
        },
      });
    }
  },

  // ==================== 工具方法 ====================

  getHandsBySession: (sessionId: string) =>
    get().hands.filter((h: Hand) => h.sessionId === sessionId),

  toggleFavorite: async (id: string): Promise<boolean> => {
    try {
      const currentHand = get().hands.find(h => h.id === id);
      if (!currentHand) {throw new Error('Hand not found');}

      const updatedHand = { ...currentHand, favorite: !currentHand.favorite };
      await get().updateHand(updatedHand);

      return updatedHand.favorite;
    } catch (error) {
      console.error('Error toggling favorite:', error);
      throw error;
    }
  },

  // ==================== 混合模式管理 ====================

  switchToLocalMode: async () => {
    console.log('🔄 切換到本地模式');
    set({ isLocalMode: true });
    await AsyncStorage.setItem('poker_storage_mode', 'local');

    // 重新載入資料
    await get().fetchSessions();
    await get().fetchHands();
    await get().fetchStats();
  },

  switchToApiMode: async () => {
    console.log('🔄 切換到 API 模式');
    set({ isLocalMode: false });
    await AsyncStorage.setItem('poker_storage_mode', 'api');

    // 重新載入資料
    await get().fetchSessions();
    await get().fetchHands();
    await get().fetchStats();
  },

  migrateToLocal: async () => {
    try {
      console.log('🚀 開始遷移資料到本地...');

      // 初始化本地資料庫
      await DatabaseService.initialize();

      // 從 API 獲取所有資料
      const [apiSessions, apiHands] = await Promise.all([
        apiCall(`${API_BASE_URL}/sessions`),
        apiCall(`${API_BASE_URL}/hands`),
      ]);

      // 轉換資料格式
      const sessions: Session[] = (apiSessions || []).map((session: any) => ({
        id: session.id,
        location: session.location || '',
        date: session.date || '',
        smallBlind: session.smallBlind || 0,
        bigBlind: session.bigBlind || 0,
        currency: session.currency || '',
        effectiveStack: session.effectiveStack || 0,
        tableSize: session.tableSize || 6,
        tag: session.tag || '',
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      }));

      const hands: Hand[] = (apiHands || []).map((hand: any) => ({
        id: hand.id,
        sessionId: hand.sessionId || '',
        position: hand.position || '',
        holeCards: hand.holeCards || '',
        board: hand.board || '',
        details: hand.details || '',
        note: hand.note || '',
        result: hand.result || 0,
        analysis: hand.analysis || '',
        analysisDate: hand.analysisDate || '',
        favorite: hand.favorite || false,
        tag: hand.tag || '',
        villains: hand.villains || [],
        date: hand.date || '',
        createdAt: hand.createdAt,
        updatedAt: hand.updatedAt,
      }));

      // 清空本地資料庫
      await DatabaseService.clearAllData();

      // 批量插入資料
      if (sessions.length > 0) {
        await DatabaseService.batchInsertSessions(sessions);
      }

      if (hands.length > 0) {
        await DatabaseService.batchInsertHands(hands);
      }

      console.log(`✅ 遷移完成！Sessions: ${sessions.length}, Hands: ${hands.length}`);

      // 切換到本地模式
      await get().switchToLocalMode();

    } catch (error) {
      console.error('❌ 遷移失敗:', error);
      throw error;
    }
  },

  // ==================== 歡迎數據管理 ====================

  checkAndCreateWelcomeData: async () => {
    try {
      const { hasCheckedWelcomeData } = get();
      // 如果已經檢查過，直接返回
      if (hasCheckedWelcomeData) {
        console.log('💡 Welcome data already checked, skipping');
        return;
      }

      // 檢查是否首次啟動
      const firstLaunchCompleted = await AsyncStorage.getItem('first_launch_completed');

      if (!firstLaunchCompleted) {
        console.log('🎉 First launch detected, creating welcome demo data...');

        // 檢查歡迎數據是否已存在（避免重複創建）
        const welcomeDataExists = await WelcomeDemoService.checkIfWelcomeDataExists();

        if (!welcomeDataExists) {
          await WelcomeDemoService.createWelcomeData();
          console.log('✅ Welcome demo data created successfully');
        } else {
          console.log('✅ Welcome demo data already exists');
        }

        // 標記首次啟動已完成
        await AsyncStorage.setItem('first_launch_completed', 'true');
      } else {
        console.log('💡 Not first launch, skipping welcome data creation');
      }

      // 標記歡迎數據已檢查
      set({ hasCheckedWelcomeData: true });
    } catch (error) {
      console.error('❌ Error in checkAndCreateWelcomeData:', error);
      // 非關鍵性錯誤，不拋出異常以免影響其他初始化
      set({ hasCheckedWelcomeData: true }); // 即使出錯也標記已檢查，避免重複嘗試
    }
  },

  // ==================== TAGS 相關方法 ====================

  getAllUsedTags: () => {
    const { hands } = get();
    const allTags = new Set<string>();

    // 添加默認的常用標籤
    const defaultTags = ['bluff', 'cooler', 'all-in', 'nits'];
    defaultTags.forEach(tag => allTags.add(tag));

    hands.forEach(hand => {
      if (hand.tags && Array.isArray(hand.tags)) {
        hand.tags.forEach(tag => {
          if (tag && tag.trim()) {
            allTags.add(tag.trim());
          }
        });
      }
    });

    // 返回按字母順序排序的tags
    return Array.from(allTags).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
  },

  // ==================== END SESSION ====================

  endSession: async (sessionId: string, cashOut: number, cashOutTime: string) => {
    const { isLocalMode, sessions } = get();

    try {
      // 找到要結束的 session
      const existingSession = sessions.find(s => s.id === sessionId);
      if (!existingSession) {
        throw new Error('Session not found');
      }

      // 更新 session 數據
      const updatedSession: Session = {
        ...existingSession,
        cashOut,
        cashOutTime,
      };

      if (isLocalMode) {
        // 使用本地 SQLite
        await DatabaseService.initialize();
        await DatabaseService.updateSession(updatedSession);
      } else {
        // 使用 API
        await apiCall(`${API_BASE_URL}/session?id=${sessionId}`, {
          method: 'PUT',
          body: JSON.stringify(updatedSession),
        });
      }

      // 重新獲取數據
      await get().fetchSessions();
      await get().fetchStats();
    } catch (error) {
      console.error('Error ending session:', error);
      throw error;
    }
  },
}));
