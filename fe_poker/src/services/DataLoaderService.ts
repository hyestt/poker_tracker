import { DatabaseService } from './DatabaseService';
import { Session, Hand } from '../models';

// 導入JSON數據
const sessionsData = require('../data/sessions.json');
const handsData = require('../data/hands.json');
const migrationStats = require('../data/migration_stats.json');

export class DataLoaderService {
  
  // 加載所有數據到本地SQLite數據庫
  static async loadDataToSQLite(): Promise<void> {
    try {
      console.log('🔄 開始加載數據到SQLite...');
      
      // 初始化數據庫
      await DatabaseService.initialize();
      
      // 清空現有數據
      await DatabaseService.clearAllData();
      
      // 轉換並加載sessions數據
      const sessions: Session[] = sessionsData.map((item: any) => ({
        id: item.id,
        location: item.location || '',
        date: item.date || '',
        smallBlind: item.smallBlind || 0,
        bigBlind: item.bigBlind || 0,
        currency: item.currency || '',
        effectiveStack: item.effectiveStack || 0,
        tableSize: item.tableSize || 6,
        tag: item.tag || '',
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      }));
      
      // 轉換並加載hands數據
      const hands: Hand[] = handsData.map((item: any) => ({
        id: item.id,
        sessionId: item.sessionId,
        details: item.details || '',
        result: item.result || 0,
        date: item.date || '',
        analysis: item.analysis || '',
        analysisDate: item.analysisDate || '',
        holeCards: item.holeCards || '',
        position: item.position || '',
        favorite: Boolean(item.favorite),
        tag: item.tag || '',
        board: item.board || '',
        note: item.note || '',
        villains: item.villains || [],
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      }));
      
      // 批量插入數據
      if (sessions.length > 0) {
        await DatabaseService.batchInsertSessions(sessions);
        console.log(`✅ 成功加載 ${sessions.length} 個 sessions`);
      }
      
      if (hands.length > 0) {
        await DatabaseService.batchInsertHands(hands);
        console.log(`✅ 成功加載 ${hands.length} 個 hands`);
      }
      
      // 驗證加載結果
      const stats = await DatabaseService.getDataStats();
      console.log('🎉 數據加載完成！統計:', stats);
      
    } catch (error) {
      console.error('❌ 數據加載失敗:', error);
      throw error;
    }
  }
  
  // 獲取遷移統計信息
  static getMigrationStats() {
    return migrationStats;
  }
  
  // 檢查是否有可用的遷移數據
  static hasAvailableData(): boolean {
    return sessionsData.length > 0 || handsData.length > 0;
  }
  
  // 獲取數據摘要
  static getDataSummary() {
    return {
      sessionsCount: sessionsData.length,
      handsCount: handsData.length,
      locations: migrationStats.locations || [],
      currencies: migrationStats.currencies || [],
      dateRange: migrationStats.dateRange || {},
      migrationDate: migrationStats.migrationDate,
    };
  }
  
  // 從本地SQLite獲取所有數據（用於驗證）
  static async getAllDataFromSQLite(): Promise<{
    sessions: Session[];
    hands: Hand[];
    stats: { sessionsCount: number; handsCount: number };
  }> {
    try {
      await DatabaseService.initialize();
      
      const [sessions, hands, stats] = await Promise.all([
        DatabaseService.getAllSessions(),
        DatabaseService.getAllHands(),
        DatabaseService.getDataStats(),
      ]);
      
      return { sessions, hands, stats };
    } catch (error) {
      console.error('❌ 從SQLite獲取數據失敗:', error);
      throw error;
    }
  }
  
  // 比較JSON數據和SQLite數據的一致性
  static async validateDataConsistency(): Promise<{
    isConsistent: boolean;
    jsonStats: { sessionsCount: number; handsCount: number };
    sqliteStats: { sessionsCount: number; handsCount: number };
  }> {
    try {
      const jsonStats = {
        sessionsCount: sessionsData.length,
        handsCount: handsData.length,
      };
      
      await DatabaseService.initialize();
      const sqliteStats = await DatabaseService.getDataStats();
      
      const isConsistent = 
        jsonStats.sessionsCount === sqliteStats.sessionsCount &&
        jsonStats.handsCount === sqliteStats.handsCount;
      
      return {
        isConsistent,
        jsonStats,
        sqliteStats,
      };
    } catch (error) {
      console.error('❌ 數據一致性檢查失敗:', error);
      return {
        isConsistent: false,
        jsonStats: { sessionsCount: 0, handsCount: 0 },
        sqliteStats: { sessionsCount: 0, handsCount: 0 },
      };
    }
  }
} 