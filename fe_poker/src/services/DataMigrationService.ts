import { DatabaseService } from './DatabaseService';
import { Session, Hand } from '../models';

export class DataMigrationService {
  
  // 從後端API獲取所有數據並遷移到本地數據庫
  static async migrateFromBackend(backendUrl: string = 'http://localhost:8080'): Promise<void> {
    try {
      console.log('開始數據遷移...');
      
      // 初始化本地數據庫
      await DatabaseService.initialize();
      
      // 獲取後端數據
      const [sessions, hands] = await Promise.all([
        this.fetchSessionsFromBackend(backendUrl),
        this.fetchHandsFromBackend(backendUrl)
      ]);
      
      console.log(`獲取到 ${sessions.length} 個 sessions 和 ${hands.length} 個 hands`);
      
      // 清空現有數據
      await DatabaseService.clearAllData();
      
      // 批量插入數據
      if (sessions.length > 0) {
        await DatabaseService.batchInsertSessions(sessions);
        console.log(`成功插入 ${sessions.length} 個 sessions`);
      }
      
      if (hands.length > 0) {
        await DatabaseService.batchInsertHands(hands);
        console.log(`成功插入 ${hands.length} 個 hands`);
      }
      
      // 驗證遷移結果
      const stats = await DatabaseService.getDataStats();
      console.log('遷移完成！統計:', stats);
      
    } catch (error) {
      console.error('數據遷移失败:', error);
      throw error;
    }
  }
  
  // 從後端獲取 sessions 數據
  private static async fetchSessionsFromBackend(backendUrl: string): Promise<Session[]> {
    try {
      const response = await fetch(`${backendUrl}/sessions`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      return data.map((item: any) => ({
        id: item.id,
        location: item.location || '',
        date: item.date || '',
        smallBlind: item.small_blind || item.smallBlind || 0,
        bigBlind: item.big_blind || item.bigBlind || 0,
        currency: item.currency || '',
        effectiveStack: item.effective_stack || item.effectiveStack || 0,
        tableSize: item.table_size || item.tableSize || 6,
        tag: item.tag || '',
        createdAt: item.created_at || item.createdAt,
        updatedAt: item.updated_at || item.updatedAt,
      }));
    } catch (error) {
      console.error('獲取 sessions 失敗:', error);
      return [];
    }
  }
  
  // 從後端獲取 hands 數據
  private static async fetchHandsFromBackend(backendUrl: string): Promise<Hand[]> {
    try {
      const response = await fetch(`${backendUrl}/hands`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      return data.map((item: any) => ({
        id: item.id,
        sessionId: item.session_id || item.sessionId,
        details: item.details || '',
        result: item.result_amount || item.result || 0,
        date: item.date || '',
        analysis: item.analysis || '',
        analysisDate: item.analysis_date || item.analysisDate || '',
        holeCards: item.hole_cards || item.holeCards || '',
        position: item.position || '',
        favorite: Boolean(item.is_favorite || item.favorite),
        tag: item.tag || '',
        board: item.board || '',
        note: item.note || '',
        villains: item.villains || [],
        createdAt: item.created_at || item.createdAt,
        updatedAt: item.updated_at || item.updatedAt,
      }));
    } catch (error) {
      console.error('獲取 hands 失敗:', error);
      return [];
    }
  }
  
  // 直接從SQLite文件遷移數據（需要文件系統訪問）
  static async migrateFromSQLiteFile(filePath: string): Promise<void> {
    // 這個方法需要在Node.js環境中運行，或者使用文件系統API
    // 在React Native中，我們主要使用API方式遷移
    throw new Error('直接文件遷移在React Native中不支持，請使用API遷移');
  }
  
  // 獲取遷移狀態
  static async getMigrationStatus(): Promise<{
    isInitialized: boolean;
    localStats: { sessionsCount: number; handsCount: number };
  }> {
    try {
      await DatabaseService.initialize();
      const localStats = await DatabaseService.getDataStats();
      
      return {
        isInitialized: true,
        localStats,
      };
    } catch (error) {
      return {
        isInitialized: false,
        localStats: { sessionsCount: 0, handsCount: 0 },
      };
    }
  }
  
  // 測試連接
  static async testBackendConnection(backendUrl: string = 'http://localhost:8080'): Promise<boolean> {
    try {
      const response = await fetch(`${backendUrl}/health`, { 
        method: 'GET'
      });
      return response.ok;
    } catch (error) {
      console.error('後端連接測試失敗:', error);
      return false;
    }
  }
} 