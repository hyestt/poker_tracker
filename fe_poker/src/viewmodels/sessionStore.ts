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
  toggleFavorite: (id: string) => Promise<boolean>;
  fetchStats: () => Promise<void>;
  getHandsBySession: (sessionId: string) => Hand[];
  getHand: (id: string) => Promise<Hand>;
  updateHand: (hand: Hand) => Promise<void>;
  getSession: (id: string) => Promise<Session>;
  updateSession: (session: Session) => Promise<void>;
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
    console.log('DEBUG: fetchHands data sample:', data.slice(0, 2));
    console.log('DEBUG: First hand favorite type:', typeof data[0]?.favorite, 'value:', data[0]?.favorite);
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
  getHand: async (id: string): Promise<Hand> => {
    const res = await fetch(`${API_URL}/hand?id=${id}`);
    if (!res.ok) {
      throw new Error('Hand not found');
    }
    const data = await res.json();
    return data;
  },
  updateHand: async (hand: Hand) => {
    await fetch(`${API_URL}/hand?id=${hand.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(hand),
    });
    await get().fetchHands();
    await get().fetchStats();
  },
  getSession: async (id: string): Promise<Session> => {
    const res = await fetch(`${API_URL}/session?id=${id}`);
    if (!res.ok) {
      throw new Error('Session not found');
    }
    const data = await res.json();
    return data;
  },
  updateSession: async (session: Session) => {
    await fetch(`${API_URL}/session?id=${session.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(session),
    });
    await get().fetchSessions();
    await get().fetchStats();
  },
  toggleFavorite: async (id: string): Promise<boolean> => {
    console.log(`Making request to: ${API_URL}/toggle-favorite`);
    console.log(`Request payload:`, { handId: id });
    
    const response = await fetch(`${API_URL}/toggle-favorite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ handId: id }),
    });
    
    console.log(`Response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Response error: ${errorText}`);
      throw new Error(`Failed to toggle favorite: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    console.log('Response data:', data);
    console.log('Before fetchHands, current hands count:', get().hands.length);
    await get().fetchHands(); // 重新獲取更新的數據
    console.log('After fetchHands, updated hands count:', get().hands.length);
    
    // Debug: 檢查特定手牌的更新狀態
    const updatedHand = get().hands.find(h => h.id === id);
    console.log('Updated hand favorite status:', updatedHand?.favorite);
    
    return data.favorite;
  },
})); 