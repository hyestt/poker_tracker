import { create } from 'zustand';
import { Session, Hand, Stats } from '../models';
import { API_BASE_URL } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface State {
  sessions: Session[];
  hands: Hand[];
  stats: Stats;
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
}

// 改進的API調用輔助函數
const apiCall = async (url: string, options?: RequestInit, retries = 3): Promise<any> => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`API Call (attempt ${attempt}): ${url}`);
      
      // 創建AbortController來處理超時
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超時
      
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      console.log(`API Response: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API Error Response: ${errorText}`);
        throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      // 檢查響應是否有內容
      const text = await response.text();
      if (!text) {
        console.log('Empty response received');
        return null; // 空響應返回 null
      }
      
      try {
        const data = JSON.parse(text);
        console.log('API Success:', data ? 'Data received' : 'No data');
        return data;
      } catch (parseError) {
        console.error('JSON Parse error:', parseError, 'Response text:', text);
        throw new Error(`Invalid JSON response: ${text.substring(0, 100)}...`);
      }
    } catch (error) {
      console.error(`API call attempt ${attempt} failed:`, error);
      
      if (attempt === retries) {
        // 最後一次嘗試失敗，拋出錯誤
        throw error;
      }
      
      // 等待後重試
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
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

  fetchSessions: async () => {
    try {
      console.log('Fetching sessions...');
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
      
      console.log(`Fetched ${sessions.length} sessions`);
      set({ sessions });
      await AsyncStorage.setItem('poker_sessions', JSON.stringify(sessions));
    } catch (error) {
      console.error('Error fetching sessions:', error);
      const cached = await AsyncStorage.getItem('poker_sessions');
      if (cached) {
        console.log('Using cached sessions');
        set({ sessions: JSON.parse(cached) });
      }
    }
  },

  addSession: async (session: Session) => {
    try {
      console.log('Adding session:', session);
      
      // 確保必填欄位有預設值
      const sessionData = {
        ...session,
        tableSize: session.tableSize || 6,
        tag: session.tag || '',
      };
      
      const result = await apiCall(`${API_BASE_URL}/sessions`, {
        method: 'POST',
        body: JSON.stringify(sessionData),
      });
      
      console.log('Session added successfully');
      await get().fetchSessions();
    } catch (error) {
      console.error('Error adding session:', error);
      // 提供更詳細的錯誤信息
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to add session: ${errorMessage}`);
    }
  },

  deleteSession: async (id: string) => {
    try {
      console.log('Deleting session:', id);
      
      const result = await apiCall(`${API_BASE_URL}/sessions?id=${id}`, {
        method: 'DELETE',
      });
      
      console.log('Session deleted successfully');
      await get().fetchSessions();
    } catch (error) {
      console.error('Error deleting session:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to delete session: ${errorMessage}`);
    }
  },

  fetchHands: async () => {
    try {
      console.log('Fetching hands...');
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
      
      console.log(`Fetched ${hands.length} hands`);
      set({ hands });
      await AsyncStorage.setItem('poker_hands', JSON.stringify(hands));
    } catch (error) {
      console.error('Error fetching hands:', error);
      const cached = await AsyncStorage.getItem('poker_hands');
      if (cached) {
        console.log('Using cached hands');
        set({ hands: JSON.parse(cached) });
      }
    }
  },

  addHand: async (hand: Hand) => {
    try {
      console.log('Adding hand:', hand);
      
      // 確保必填欄位有預設值
      const handData = {
        ...hand,
        favorite: hand.favorite || false,
        result: hand.result || 0,
        villains: hand.villains || [],
      };
      
      const result = await apiCall(`${API_BASE_URL}/hands`, {
        method: 'POST',
        body: JSON.stringify(handData),
      });
      
      console.log('Hand added successfully');
      await get().fetchHands();
      await get().fetchStats();
    } catch (error) {
      console.error('Error adding hand:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to add hand: ${errorMessage}`);
    }
  },

  deleteHand: async (id: string) => {
    try {
      console.log('Deleting hand:', id);
      
      const result = await apiCall(`${API_BASE_URL}/hands?id=${id}`, {
        method: 'DELETE',
      });
      
      console.log('Hand deleted successfully');
      await get().fetchHands();
      await get().fetchStats();
    } catch (error) {
      console.error('Error deleting hand:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to delete hand: ${errorMessage}`);
    }
  },

  analyzeHand: async (id: string): Promise<string> => {
    try {
      console.log('Analyzing hand:', id);
      
      const response = await apiCall(`${API_BASE_URL}/analyze`, {
        method: 'POST',
        body: JSON.stringify({ handId: id }),
      });
      
      console.log('Hand analyzed successfully');
      await get().fetchHands();
      return response?.analysis || 'Analysis completed';
    } catch (error) {
      console.error('Error analyzing hand:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to analyze hand: ${errorMessage}`);
    }
  },

  fetchStats: async () => {
    try {
      console.log('Fetching stats...');
      const data = await apiCall(`${API_BASE_URL}/stats`);
      
      const stats: Stats = {
        totalProfit: data?.totalProfit || 0,
        totalSessions: data?.totalSessions || 0,
        winRate: data?.winRate || 0,
        avgSession: data?.avgSession || 0,
        byStakes: data?.byStakes || {},
        byLocation: data?.byLocation || {},
      };
      
      console.log('Stats fetched successfully');
      set({ stats });
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
        }
      });
    }
  },

  getHandsBySession: (sessionId: string) => 
    get().hands.filter((h: Hand) => h.sessionId === sessionId),

  getHand: async (id: string): Promise<Hand> => {
    try {
      console.log('Getting hand:', id);
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
    } catch (error) {
      console.error('Error getting hand:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to get hand: ${errorMessage}`);
    }
  },

  updateHand: async (hand: Hand) => {
    try {
      console.log('Updating hand:', hand.id);
      
      // 確保所有欄位都正確傳送
      const handData = {
        ...hand,
        favorite: hand.favorite || false,
        result: hand.result || 0,
        villains: hand.villains || [],
      };
      
      const result = await apiCall(`${API_BASE_URL}/hand?id=${hand.id}`, {
        method: 'PUT',
        body: JSON.stringify(handData),
      });
      
      console.log('Hand updated successfully');
      await get().fetchHands();
      await get().fetchStats();
    } catch (error) {
      console.error('Error updating hand:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to update hand: ${errorMessage}`);
    }
  },

  getSession: async (id: string): Promise<Session> => {
    try {
      console.log('Getting session:', id);
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
    } catch (error) {
      console.error('Error getting session:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to get session: ${errorMessage}`);
    }
  },

  updateSession: async (session: Session) => {
    try {
      console.log('Updating session:', session.id);
      
      // 確保所有欄位都正確傳送
      const sessionData = {
        ...session,
        tableSize: session.tableSize || 6,
        tag: session.tag || '',
      };
      
      const result = await apiCall(`${API_BASE_URL}/session?id=${session.id}`, {
        method: 'PUT',
        body: JSON.stringify(sessionData),
      });
      
      console.log('Session updated successfully');
      await get().fetchSessions();
      await get().fetchStats();
    } catch (error) {
      console.error('Error updating session:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to update session: ${errorMessage}`);
    }
  },

  toggleFavorite: async (id: string): Promise<boolean> => {
    try {
      console.log('Toggling favorite for hand:', id);
      
      const currentHand = get().hands.find(h => h.id === id);
      if (!currentHand) throw new Error('Hand not found');
      
      const updatedHand = { ...currentHand, favorite: !currentHand.favorite };
      await get().updateHand(updatedHand);
      
      console.log('Favorite toggled successfully');
      return updatedHand.favorite;
    } catch (error) {
      console.error('Error toggling favorite:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to toggle favorite: ${errorMessage}`);
    }
  },
})); 