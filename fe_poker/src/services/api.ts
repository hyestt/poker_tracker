import config from '../config';
import { Hand, Session, Stats } from '../types';

// API服務類
class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = config.BASE_URL;
  }

  // 處理API錯誤
  private handleError(error: any): never {
    console.error('API錯誤:', error);
    throw error;
  }

  // 獲取所有手牌
  async getHands(): Promise<Hand[]> {
    try {
      const response = await fetch(`${this.baseUrl}${config.ENDPOINTS.HANDS}`);
      if (!response.ok) throw new Error(`API錯誤: ${response.status}`);
      return await response.json();
    } catch (error) {
      return this.handleError(error);
    }
  }

  // 獲取所有牌局
  async getSessions(): Promise<Session[]> {
    try {
      const response = await fetch(`${this.baseUrl}${config.ENDPOINTS.SESSIONS}`);
      if (!response.ok) throw new Error(`API錯誤: ${response.status}`);
      return await response.json();
    } catch (error) {
      return this.handleError(error);
    }
  }

  // 創建新手牌
  async createHand(hand: Omit<Hand, 'id'>): Promise<Hand> {
    try {
      const response = await fetch(`${this.baseUrl}${config.ENDPOINTS.HANDS}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(hand),
      });
      if (!response.ok) throw new Error(`API錯誤: ${response.status}`);
      return await response.json();
    } catch (error) {
      return this.handleError(error);
    }
  }

  // 刪除手牌
  async deleteHand(id: number): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}${config.ENDPOINTS.HANDS}/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error(`API錯誤: ${response.status}`);
    } catch (error) {
      this.handleError(error);
    }
  }

  // 分析手牌
  async analyzeHand(id: number): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}${config.ENDPOINTS.ANALYZE}/${id}`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error(`API錯誤: ${response.status}`);
      const data = await response.json();
      return data.analysis || '無法取得分析結果';
    } catch (error) {
      return this.handleError(error);
    }
  }

  // 獲取統計數據
  async getStats(): Promise<Stats> {
    try {
      const response = await fetch(`${this.baseUrl}${config.ENDPOINTS.STATS}`);
      if (!response.ok) throw new Error(`API錯誤: ${response.status}`);
      return await response.json();
    } catch (error) {
      return this.handleError(error);
    }
  }
}

// 導出單例
export default new ApiService(); 