// @ts-ignore
import SQLite from 'react-native-sqlite-storage';
import { Session, Hand } from '../models';

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

  // Sessions CRUD 操作
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

  // Hands CRUD 操作
  static async getAllHands(): Promise<Hand[]> {
    if (!this.db) throw new Error('Database not initialized');

    const [results] = await this.db.executeSql('SELECT * FROM hands ORDER BY date DESC');
    const hands: Hand[] = [];

    for (let i = 0; i < results.rows.length; i++) {
      const row = results.rows.item(i);
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
        villains: row.villains || '',
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      });
    }

    return hands;
  }

  static async insertHand(hand: Hand): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const sql = `
      INSERT INTO hands (id, session_id, details, result_amount, date, analysis, analysis_date, 
                        hole_cards, position, is_favorite, tag, board, note, villains)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

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
      hand.villains || '',
    ]);
  }

  // 批量插入數據
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
          hand.isFavorite ? 1 : 0,
          hand.tag || '',
          hand.board || '',
          hand.note || '',
          hand.villains || '',
        ]);
      }
    });
  }

  // 清空所有數據
  static async clearAllData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.executeSql('DELETE FROM hands');
    await this.db.executeSql('DELETE FROM sessions');
  }

  // 獲取數據統計
  static async getDataStats(): Promise<{ sessionsCount: number; handsCount: number }> {
    if (!this.db) throw new Error('Database not initialized');

    const [sessionResults] = await this.db.executeSql('SELECT COUNT(*) as count FROM sessions');
    const [handResults] = await this.db.executeSql('SELECT COUNT(*) as count FROM hands');

    return {
      sessionsCount: sessionResults.rows.item(0).count,
      handsCount: handResults.rows.item(0).count,
    };
  }

  // 關閉數據庫連接
  static async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
    }
  }
} 