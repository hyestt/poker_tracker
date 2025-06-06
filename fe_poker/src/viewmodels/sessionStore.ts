import { create } from 'zustand';
import { Session, Hand, Stats } from '../models';

import { API_BASE_URL } from "../config/api";
const API_URL = API_BASE_URL;
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
  fetchStats: () => Promise<void>;
  getHandsBySession: (sessionId: string) => Hand[];
}

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
    const res = await fetch(`${API_URL}/sessions`);
    const data = await res.json();
    set({ sessions: data });
  },
  addSession: async (session: Session) => {
    await fetch(`${API_URL}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(session),
    });
    await get().fetchSessions();
  },
  deleteSession: async (id: string) => {
    await fetch(`${API_URL}/sessions?id=${id}`, {
      method: 'DELETE',
    });
    await get().fetchSessions();
  },
  fetchHands: async () => {
    const res = await fetch(`${API_URL}/hands`);
    const data = await res.json();
    set({ hands: data });
  },
  addHand: async (hand: Hand) => {
    await fetch(`${API_URL}/hands`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(hand),
    });
    await get().fetchHands();
    await get().fetchStats();
  },
  deleteHand: async (id: string) => {
    await fetch(`${API_URL}/hands?id=${id}`, {
      method: 'DELETE',
    });
    await get().fetchHands();
    await get().fetchStats();
  },
  analyzeHand: async (id: string): Promise<string> => {
    const response = await fetch(`${API_URL}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ handId: id }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to analyze hand');
    }
    
    const data = await response.json();
    await get().fetchHands(); // 重新獲取更新的數據
    return data.analysis;
  },
  fetchStats: async () => {
    const res = await fetch(`${API_URL}/stats`);
    const data = await res.json();
    set({ stats: data });
  },
  getHandsBySession: (sessionId: string) => get().hands.filter((h: Hand) => h.sessionId === sessionId),
})); 