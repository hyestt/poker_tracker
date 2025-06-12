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
  
  return response.json();
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
      const data = await apiCall(`${API_BASE_URL}/sessions`);
      
      const sessions: Session[] = data.map((session: any) => ({
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
    } catch (error) {
      console.error('Error fetching sessions:', error);
      const cached = await AsyncStorage.getItem('poker_sessions');
      if (cached) {
        set({ sessions: JSON.parse(cached) });
      }
    }
  },

  addSession: async (session: Session) => {
    try {
      // 確保必填欄位有預設值
      const sessionData = {
        ...session,
        tableSize: session.tableSize || 6,
        tag: session.tag || '',
      };
      
      await apiCall(`${API_BASE_URL}/sessions`, {
        method: 'POST',
        body: JSON.stringify(sessionData),
      });
      
      await get().fetchSessions();
    } catch (error) {
      console.error('Error adding session:', error);
      throw error;
    }
  },

  deleteSession: async (id: string) => {
    try {
      await apiCall(`${API_BASE_URL}/sessions?id=${id}`, {
        method: 'DELETE',
      });
      
      await get().fetchSessions();
    } catch (error) {
      console.error('Error deleting session:', error);
      throw error;
    }
  },

  fetchHands: async () => {
    try {
      const data = await apiCall(`${API_BASE_URL}/hands`);
      
      const hands: Hand[] = data.map((hand: any) => ({
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
    } catch (error) {
      console.error('Error fetching hands:', error);
      const cached = await AsyncStorage.getItem('poker_hands');
      if (cached) {
        set({ hands: JSON.parse(cached) });
      }
    }
  },

  addHand: async (hand: Hand) => {
    try {
      // 確保必填欄位有預設值
      const handData = {
        ...hand,
        favorite: hand.favorite || false,
        result: hand.result || 0,
        villains: hand.villains || [],
      };
      
      await apiCall(`${API_BASE_URL}/hands`, {
        method: 'POST',
        body: JSON.stringify(handData),
      });
      
      await get().fetchHands();
      await get().fetchStats();
    } catch (error) {
      console.error('Error adding hand:', error);
      throw error;
    }
  },

  deleteHand: async (id: string) => {
    try {
      await apiCall(`${API_BASE_URL}/hands?id=${id}`, {
        method: 'DELETE',
      });
      
      await get().fetchHands();
      await get().fetchStats();
    } catch (error) {
      console.error('Error deleting hand:', error);
      throw error;
    }
  },

  analyzeHand: async (id: string): Promise<string> => {
    try {
      const response = await apiCall(`${API_BASE_URL}/analyze`, {
        method: 'POST',
        body: JSON.stringify({ handId: id }),
      });
      
      await get().fetchHands();
      return response.analysis || 'Analysis completed';
    } catch (error) {
      console.error('Error analyzing hand:', error);
      throw error;
    }
  },

  fetchStats: async () => {
    try {
      const data = await apiCall(`${API_BASE_URL}/stats`);
      
      const stats: Stats = {
        totalProfit: data.totalProfit || 0,
        totalSessions: data.totalSessions || 0,
        winRate: data.winRate || 0,
        avgSession: data.avgSession || 0,
        byStakes: data.byStakes || {},
        byLocation: data.byLocation || {},
      };
      
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
      const data = await apiCall(`${API_BASE_URL}/hand?id=${id}`);
      
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
      throw error;
    }
  },

  updateHand: async (hand: Hand) => {
    try {
      // 確保所有欄位都正確傳送
      const handData = {
        ...hand,
        favorite: hand.favorite || false,
        result: hand.result || 0,
        villains: hand.villains || [],
      };
      
      await apiCall(`${API_BASE_URL}/hand?id=${hand.id}`, {
        method: 'PUT',
        body: JSON.stringify(handData),
      });
      
      await get().fetchHands();
      await get().fetchStats();
    } catch (error) {
      console.error('Error updating hand:', error);
      throw error;
    }
  },

  getSession: async (id: string): Promise<Session> => {
    try {
      const data = await apiCall(`${API_BASE_URL}/session?id=${id}`);
      
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
      throw error;
    }
  },

  updateSession: async (session: Session) => {
    try {
      // 確保所有欄位都正確傳送
      const sessionData = {
        ...session,
        tableSize: session.tableSize || 6,
        tag: session.tag || '',
      };
      
      await apiCall(`${API_BASE_URL}/session?id=${session.id}`, {
        method: 'PUT',
        body: JSON.stringify(sessionData),
      });
      
      await get().fetchSessions();
      await get().fetchStats();
    } catch (error) {
      console.error('Error updating session:', error);
      throw error;
    }
  },

  toggleFavorite: async (id: string): Promise<boolean> => {
    try {
      const currentHand = get().hands.find(h => h.id === id);
      if (!currentHand) throw new Error('Hand not found');
      
      const updatedHand = { ...currentHand, favorite: !currentHand.favorite };
      await get().updateHand(updatedHand);
      
      return updatedHand.favorite;
    } catch (error) {
      console.error('Error toggling favorite:', error);
      throw error;
    }
  },
})); 