import axios from 'axios';
import { Action, PokerHand, Statistic } from '../models/types';

const API_URL = 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 手牌相關API
export const handsApi = {
  // 獲取所有手牌
  getAll: async (): Promise<PokerHand[]> => {
    const response = await api.get('/hands');
    return response.data;
  },

  // 獲取單個手牌
  getById: async (id: number): Promise<PokerHand> => {
    const response = await api.get(`/hands/${id}`);
    return response.data;
  },

  // 創建手牌
  create: async (hand: PokerHand): Promise<PokerHand> => {
    const response = await api.post('/hands', hand);
    return response.data;
  },

  // 更新手牌
  update: async (id: number, hand: PokerHand): Promise<PokerHand> => {
    const response = await api.put(`/hands/${id}`, hand);
    return response.data;
  },

  // 刪除手牌
  delete: async (id: number): Promise<void> => {
    await api.delete(`/hands/${id}`);
  },
};

// 動作相關API
export const actionsApi = {
  // 獲取手牌的所有動作
  getByHandId: async (handId: number): Promise<Action[]> => {
    const response = await api.get(`/hands/${handId}/actions`);
    return response.data;
  },

  // 獲取單個動作
  getById: async (id: number): Promise<Action> => {
    const response = await api.get(`/actions/${id}`);
    return response.data;
  },

  // 創建動作
  create: async (handId: number, action: Action): Promise<Action> => {
    const response = await api.post(`/hands/${handId}/actions`, action);
    return response.data;
  },

  // 更新動作
  update: async (id: number, action: Action): Promise<Action> => {
    const response = await api.put(`/actions/${id}`, action);
    return response.data;
  },

  // 刪除動作
  delete: async (id: number): Promise<void> => {
    await api.delete(`/actions/${id}`);
  },
};

// 統計資料API
export const statsApi = {
  // 獲取統計資料
  get: async (): Promise<Statistic> => {
    const response = await api.get('/stats');
    return response.data;
  },
}; 