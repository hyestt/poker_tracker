// @ts-ignore
import SQLite from 'react-native-sqlite-storage';
import { Session, Hand, Stats } from '../models';

// 啟用調試模式
SQLite.DEBUG(true);
SQLite.enablePromise(true);

export class DatabaseService {
  private static db: SQLite.SQLiteDatabase | null = null;
  private static readonly DB_NAME = 'poker_tracker.db';
  private static readonly DB_VERSION = '1.0';
  private static readonly DB_DISPLAY_NAME = 'Poker Tracker Database';
  private static readonly DB_SIZE = 200000;

  // 初始化數據庫
  static async initialize(): Promise<void> {
    try {
      this.db = await SQLite.openDatabase({
        name: this.DB_NAME,
        version: this.DB_VERSION,
        displayName: this.DB_DISPLAY_NAME,
        size: this.DB_SIZE,
      });

      await this.createTables();
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw error;
    }
  }

  // 創建表結構
  private static async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const createSessionsTable = `
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        location TEXT,
        date TEXT,
        small_blind INTEGER,
        big_blind INTEGER,
        currency TEXT,
        effective_stack INTEGER,
        table_size INTEGER DEFAULT 6,
        tag TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const createHandsTable = `
      CREATE TABLE IF NOT EXISTS hands (
        id TEXT PRIMARY KEY,
        session_id TEXT,
        details TEXT,
        result_amount INTEGER,
        date TEXT,
        analysis TEXT,
        analysis_date TEXT,
        hole_cards TEXT,
        position TEXT,
        is_favorite INTEGER DEFAULT 0,
        tag TEXT,
        board TEXT,
        note TEXT,
        villains TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(session_id) REFERENCES sessions(id)
      );
    `;

    await this.db.executeSql(createSessionsTable);
    await this.db.executeSql(createHandsTable);
  }

  // ==================== SESSIONS CRUD ====================
  
  static async getAllSessions(): Promise<Session[]> {
    if (!this.db) throw new Error('Database not initialized');

    const [results] = await this.db.executeSql('SELECT * FROM sessions ORDER BY date DESC');
    const sessions: Session[] = [];

    for (let i = 0; i < results.rows.length; i++) {
      const row = results.rows.item(i);
      sessions.push({
        id: row.id,
        location: row.location || '',
        date: row.date || '',
        smallBlind: row.small_blind || 0,
        bigBlind: row.big_blind || 0,
        currency: row.currency || '',
        effectiveStack: row.effective_stack || 0,
        tableSize: row.table_size || 6,
        tag: row.tag || '',
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      });
    }

    return sessions;
  }

  static async getSession(id: string): Promise<Session | null> {
    if (!this.db) throw new Error('Database not initialized');

    const [results] = await this.db.executeSql('SELECT * FROM sessions WHERE id = ?', [id]);
    
    if (results.rows.length === 0) {
      return null;
    }

    const row = results.rows.item(0);
    return {
      id: row.id,
      location: row.location || '',
      date: row.date || '',
      smallBlind: row.small_blind || 0,
      bigBlind: row.big_blind || 0,
      currency: row.currency || '',
      effectiveStack: row.effective_stack || 0,
      tableSize: row.table_size || 6,
      tag: row.tag || '',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  static async insertSession(session: Session): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const sql = `
      INSERT INTO sessions (id, location, date, small_blind, big_blind, currency, effective_stack, table_size, tag)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await this.db.executeSql(sql, [
      session.id,
      session.location,
      session.date,
      session.smallBlind,
      session.bigBlind,
      session.currency,
      session.effectiveStack,
      session.tableSize || 6,
      session.tag || '',
    ]);
  }

  static async updateSession(session: Session): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const sql = `
      UPDATE sessions 
      SET location = ?, date = ?, small_blind = ?, big_blind = ?, currency = ?, 
          effective_stack = ?, table_size = ?, tag = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    await this.db.executeSql(sql, [
      session.location,
      session.date,
      session.smallBlind,
      session.bigBlind,
      session.currency,
      session.effectiveStack,
      session.tableSize || 6,
      session.tag || '',
      session.id,
    ]);
  }

  static async deleteSession(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // 先刪除相關的 hands
    await this.db.executeSql('DELETE FROM hands WHERE session_id = ?', [id]);
    
    // 再刪除 session
    await this.db.executeSql('DELETE FROM sessions WHERE id = ?', [id]);
  }

  // ==================== HANDS CRUD ====================

  static async getAllHands(): Promise<Hand[]> {
    if (!this.db) throw new Error('Database not initialized');

    const [results] = await this.db.executeSql('SELECT * FROM hands ORDER BY date DESC');
    const hands: Hand[] = [];

    for (let i = 0; i < results.rows.length; i++) {
      const row = results.rows.item(i);
      
      // 解析 villains JSON
      let villains = [];
      try {
        if (row.villains && row.villains !== '[]') {
          villains = JSON.parse(row.villains);
        }
      } catch (error) {
        console.warn('Failed to parse villains JSON:', row.villains);
      }

      hands.push({
        id: row.id,
        sessionId: row.session_id,
        details: row.details || '',
        result: row.result_amount || 0,
        date: row.date || '',
        analysis: row.analysis || '',
        analysisDate: row.analysis_date || '',
        holeCards: row.hole_cards || '',
        position: row.position || '',
        favorite: Boolean(row.is_favorite),
        tag: row.tag || '',
        board: row.board || '',
        note: row.note || '',
        villains: villains,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      });
    }

    return hands;
  }

  static async getHand(id: string): Promise<Hand | null> {
    if (!this.db) throw new Error('Database not initialized');

    const [results] = await this.db.executeSql('SELECT * FROM hands WHERE id = ?', [id]);
    
    if (results.rows.length === 0) {
      return null;
    }

    const row = results.rows.item(0);
    
    // 解析 villains JSON
    let villains = [];
    try {
      if (row.villains && row.villains !== '[]') {
        villains = JSON.parse(row.villains);
      }
    } catch (error) {
      console.warn('Failed to parse villains JSON:', row.villains);
    }

    return {
      id: row.id,
      sessionId: row.session_id,
      details: row.details || '',
      result: row.result_amount || 0,
      date: row.date || '',
      analysis: row.analysis || '',
      analysisDate: row.analysis_date || '',
      holeCards: row.hole_cards || '',
      position: row.position || '',
      favorite: Boolean(row.is_favorite),
      tag: row.tag || '',
      board: row.board || '',
      note: row.note || '',
      villains: villains,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  static async insertHand(hand: Hand): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const sql = `
      INSERT INTO hands (id, session_id, details, result_amount, date, analysis, analysis_date, 
                        hole_cards, position, is_favorite, tag, board, note, villains)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    // 序列化 villains
    const villainsJson = JSON.stringify(hand.villains || []);

    await this.db.executeSql(sql, [
      hand.id,
      hand.sessionId,
      hand.details,
      hand.result,
      hand.date,
      hand.analysis || '',
      hand.analysisDate || '',
      hand.holeCards || '',
      hand.position || '',
      hand.favorite ? 1 : 0,
      hand.tag || '',
      hand.board || '',
      hand.note || '',
      villainsJson,
    ]);
  }

  static async updateHand(hand: Hand): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const sql = `
      UPDATE hands 
      SET session_id = ?, details = ?, result_amount = ?, date = ?, analysis = ?, analysis_date = ?,
          hole_cards = ?, position = ?, is_favorite = ?, tag = ?, board = ?, note = ?, villains = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    // 序列化 villains
    const villainsJson = JSON.stringify(hand.villains || []);

    await this.db.executeSql(sql, [
      hand.sessionId,
      hand.details,
      hand.result,
      hand.date,
      hand.analysis || '',
      hand.analysisDate || '',
      hand.holeCards || '',
      hand.position || '',
      hand.favorite ? 1 : 0,
      hand.tag || '',
      hand.board || '',
      hand.note || '',
      villainsJson,
      hand.id,
    ]);
  }

  static async deleteHand(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.executeSql('DELETE FROM hands WHERE id = ?', [id]);
  }

  static async getHandsBySession(sessionId: string): Promise<Hand[]> {
    if (!this.db) throw new Error('Database not initialized');

    const [results] = await this.db.executeSql('SELECT * FROM hands WHERE session_id = ? ORDER BY date DESC', [sessionId]);
    const hands: Hand[] = [];

    for (let i = 0; i < results.rows.length; i++) {
      const row = results.rows.item(i);
      
      // 解析 villains JSON
      let villains = [];
      try {
        if (row.villains && row.villains !== '[]') {
          villains = JSON.parse(row.villains);
        }
      } catch (error) {
        console.warn('Failed to parse villains JSON:', row.villains);
      }

      hands.push({
        id: row.id,
        sessionId: row.session_id,
        details: row.details || '',
        result: row.result_amount || 0,
        date: row.date || '',
        analysis: row.analysis || '',
        analysisDate: row.analysis_date || '',
        holeCards: row.hole_cards || '',
        position: row.position || '',
        favorite: Boolean(row.is_favorite),
        tag: row.tag || '',
        board: row.board || '',
        note: row.note || '',
        villains: villains,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      });
    }

    return hands;
  }

  // ==================== STATS 計算 ====================

  static async getStats(): Promise<Stats> {
    if (!this.db) throw new Error('Database not initialized');

    // 獲取所有 hands 和 sessions 數據
    const [handsResults] = await this.db.executeSql('SELECT result_amount, session_id FROM hands');
    const [sessionsResults] = await this.db.executeSql('SELECT id, location, small_blind, big_blind FROM sessions');

    let totalProfit = 0;
    const sessionProfits: { [key: string]: number } = {};
    const byStakes: { [key: string]: number } = {};
    const byLocation: { [key: string]: number } = {};
    
    // 計算每個 session 的利潤
    for (let i = 0; i < handsResults.rows.length; i++) {
      const row = handsResults.rows.item(i);
      const result = row.result_amount || 0;
      const sessionId = row.session_id;
      
      totalProfit += result;
      
      if (!sessionProfits[sessionId]) {
        sessionProfits[sessionId] = 0;
      }
      sessionProfits[sessionId] += result;
    }

    let sessionCount = 0;
    let winSessions = 0;

    // 計算按 stakes 和 location 的統計
    for (let i = 0; i < sessionsResults.rows.length; i++) {
      const row = sessionsResults.rows.item(i);
      const sessionId = row.id;
      const location = row.location || 'Unknown';
      const smallBlind = row.small_blind || 0;
      const bigBlind = row.big_blind || 0;
      
      sessionCount++;
      
      const profit = sessionProfits[sessionId] || 0;
      if (profit > 0) {
        winSessions++;
      }
      
      // 按 stakes 分組
      const stakeKey = `$${smallBlind}/$${bigBlind}`;
      if (!byStakes[stakeKey]) {
        byStakes[stakeKey] = 0;
      }
      byStakes[stakeKey] += profit;
      
      // 按 location 分組
      if (!byLocation[location]) {
        byLocation[location] = 0;
      }
      byLocation[location] += profit;
    }

    const avgSession = sessionCount > 0 ? totalProfit / sessionCount : 0;
    const winRate = sessionCount > 0 ? Math.round((winSessions / sessionCount) * 100) : 0;

    return {
      totalProfit,
      totalSessions: sessionCount,
      winRate,
      avgSession,
      byStakes,
      byLocation,
    };
  }

  // ==================== 批量操作 ====================

  static async batchInsertSessions(sessions: Session[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.transaction(async (tx) => {
      for (const session of sessions) {
        const sql = `
          INSERT OR REPLACE INTO sessions (id, location, date, small_blind, big_blind, currency, effective_stack, table_size, tag)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        await tx.executeSql(sql, [
          session.id,
          session.location,
          session.date,
          session.smallBlind,
          session.bigBlind,
          session.currency,
          session.effectiveStack,
          session.tableSize || 6,
          session.tag || '',
        ]);
      }
    });
  }

  static async batchInsertHands(hands: Hand[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.transaction(async (tx) => {
      for (const hand of hands) {
        const sql = `
          INSERT OR REPLACE INTO hands (id, session_id, details, result_amount, date, analysis, analysis_date, 
                                      hole_cards, position, is_favorite, tag, board, note, villains)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const villainsJson = JSON.stringify(hand.villains || []);
        
        await tx.executeSql(sql, [
          hand.id,
          hand.sessionId,
          hand.details,
          hand.result,
          hand.date,
          hand.analysis || '',
          hand.analysisDate || '',
          hand.holeCards || '',
          hand.position || '',
          hand.favorite ? 1 : 0,
          hand.tag || '',
          hand.board || '',
          hand.note || '',
          villainsJson,
        ]);
      }
    });
  }

  // ==================== 工具方法 ====================

  static async clearAllData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.executeSql('DELETE FROM hands');
    await this.db.executeSql('DELETE FROM sessions');
  }

  static async getDataStats(): Promise<{ sessionsCount: number; handsCount: number }> {
    if (!this.db) throw new Error('Database not initialized');

    const [sessionsResult] = await this.db.executeSql('SELECT COUNT(*) as count FROM sessions');
    const [handsResult] = await this.db.executeSql('SELECT COUNT(*) as count FROM hands');

    return {
      sessionsCount: sessionsResult.rows.item(0).count,
      handsCount: handsResult.rows.item(0).count,
    };
  }

  static async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
    }
  }
} 