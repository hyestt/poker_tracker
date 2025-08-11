// @ts-ignore
import SQLite from 'react-native-sqlite-storage';
import { Session, Hand, Stats } from '../models';

// 啟用調試模式
SQLite.DEBUG(true);
SQLite.enablePromise(true);

export class DatabaseService {
  private static db: SQLite.SQLiteDatabase | null = null;
  private static isInitialized: boolean = false;
  private static isInitializing: boolean = false;
  private static readonly DB_NAME = 'poker_tracker.db';
  private static readonly DB_VERSION = '1.1';
  private static readonly DB_DISPLAY_NAME = 'LiveHand Database';
  private static readonly DB_SIZE = 200000;

  // 初始化數據庫
  static async initialize(): Promise<void> {
    // 如果已經初始化，直接返回
    if (this.isInitialized && this.db) {
      return;
    }

    // 如果正在初始化，等待完成
    if (this.isInitializing) {
      while (this.isInitializing) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      return;
    }

    this.isInitializing = true;
    try {
      this.db = await SQLite.openDatabase({
        name: this.DB_NAME,
        version: this.DB_VERSION,
        displayName: this.DB_DISPLAY_NAME,
        size: this.DB_SIZE,
      });

      await this.createTables();
      await this.migrateDatabase();
      this.isInitialized = true;
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw error;
    } finally {
      this.isInitializing = false;
    }
  }

  // 創建表結構
  private static async createTables(): Promise<void> {
    if (!this.db) {throw new Error('Database not initialized');}

    const createSessionsTable = `
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        location TEXT,
        date TEXT,
        small_blind INTEGER,
        big_blind INTEGER,
        currency TEXT,
        effective_stack INTEGER,
        buy_in INTEGER,
        cash_out REAL,
        cash_out_time TEXT,
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
        tags TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(session_id) REFERENCES sessions(id)
      );
    `;

    await this.db.executeSql(createSessionsTable);
    await this.db.executeSql(createHandsTable);
  }

  // 數據庫遷移
  private static async migrateDatabase(): Promise<void> {
    if (!this.db) {throw new Error('Database not initialized');}

    try {
      // 檢查並添加hands表的缺失欄位
      const [handsResult] = await this.db.executeSql('PRAGMA table_info(hands)');
      const handsColumns = new Set();
      for (let i = 0; i < handsResult.rows.length; i++) {
        const row = handsResult.rows.item(i);
        handsColumns.add(row.name);
      }

      if (!handsColumns.has('tags')) {
        console.log('Adding tags column to hands table');
        await this.db.executeSql('ALTER TABLE hands ADD COLUMN tags TEXT');
      }

      if (!handsColumns.has('created_at')) {
        console.log('Adding created_at column to hands table');
        await this.db.executeSql('ALTER TABLE hands ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP');
      }

      if (!handsColumns.has('updated_at')) {
        console.log('Adding updated_at column to hands table');
        await this.db.executeSql('ALTER TABLE hands ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP');
      }

      // 為現有記錄設定時間戳值（如果為 NULL）
      console.log('Updating NULL timestamps in hands table');
      await this.db.executeSql(`
        UPDATE hands 
        SET created_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
        WHERE created_at IS NULL OR updated_at IS NULL
      `);

      // 檢查並添加sessions表的新欄位
      const [sessionResult] = await this.db.executeSql('PRAGMA table_info(sessions)');
      const sessionColumns = new Set();
      for (let i = 0; i < sessionResult.rows.length; i++) {
        const row = sessionResult.rows.item(i);
        sessionColumns.add(row.name);
      }

      if (!sessionColumns.has('buy_in')) {
        console.log('Adding buy_in column to sessions table');
        await this.db.executeSql('ALTER TABLE sessions ADD COLUMN buy_in INTEGER');
      }

      if (!sessionColumns.has('cash_out')) {
        console.log('Adding cash_out column to sessions table');
        await this.db.executeSql('ALTER TABLE sessions ADD COLUMN cash_out REAL');
      }

      if (!sessionColumns.has('cash_out_time')) {
        console.log('Adding cash_out_time column to sessions table');
        await this.db.executeSql('ALTER TABLE sessions ADD COLUMN cash_out_time TEXT');
      }
    } catch (error) {
      console.error('Database migration failed:', error);
      // 不拋出錯誤，因為遷移失敗不應該阻止應用運行
    }
  }

  // ==================== SESSIONS CRUD ====================

  static async getAllSessions(): Promise<Session[]> {
    if (!this.db) {throw new Error('Database not initialized');}

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
        buyIn: row.buy_in || undefined,
        cashOut: row.cash_out || undefined,
        cashOutTime: row.cash_out_time || undefined,
        tableSize: row.table_size || 6,
        tag: row.tag || '',
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      });
    }

    return sessions;
  }

  static async getSession(id: string): Promise<Session | null> {
    if (!this.db) {throw new Error('Database not initialized');}

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
      buyIn: row.buy_in || undefined,
      cashOut: row.cash_out || undefined,
      cashOutTime: row.cash_out_time || undefined,
      tableSize: row.table_size || 6,
      tag: row.tag || '',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  static async insertSession(session: Session): Promise<void> {
    if (!this.db) {throw new Error('Database not initialized');}

    const sql = `
      INSERT INTO sessions (id, location, date, small_blind, big_blind, currency, effective_stack, buy_in, cash_out, cash_out_time, table_size, tag)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await this.db.executeSql(sql, [
      session.id,
      session.location,
      session.date,
      session.smallBlind,
      session.bigBlind,
      session.currency,
      session.effectiveStack,
      session.buyIn || null,
      session.cashOut || null,
      session.cashOutTime || null,
      session.tableSize || 6,
      session.tag || '',
    ]);
  }

  static async updateSession(session: Session): Promise<void> {
    if (!this.db) {throw new Error('Database not initialized');}

    const sql = `
      UPDATE sessions 
      SET location = ?, date = ?, small_blind = ?, big_blind = ?, currency = ?, 
          effective_stack = ?, buy_in = ?, cash_out = ?, cash_out_time = ?, table_size = ?, tag = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    await this.db.executeSql(sql, [
      session.location,
      session.date,
      session.smallBlind,
      session.bigBlind,
      session.currency,
      session.effectiveStack,
      session.buyIn || null,
      session.cashOut || null,
      session.cashOutTime || null,
      session.tableSize || 6,
      session.tag || '',
      session.id,
    ]);
  }

  static async deleteSession(id: string): Promise<void> {
    if (!this.db) {throw new Error('Database not initialized');}

    // 先刪除相關的 hands
    await this.db.executeSql('DELETE FROM hands WHERE session_id = ?', [id]);

    // 再刪除 session
    await this.db.executeSql('DELETE FROM sessions WHERE id = ?', [id]);
  }

  // ==================== HANDS CRUD ====================

  static async getAllHands(): Promise<Hand[]> {
    if (!this.db) {throw new Error('Database not initialized');}

    const [results] = await this.db.executeSql('SELECT * FROM hands ORDER BY updated_at DESC, created_at DESC');
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

      // 解析 tags JSON
      let tags = [];
      try {
        if (row.tags && row.tags !== '[]') {
          tags = JSON.parse(row.tags);
        }
      } catch (error) {
        console.warn('Failed to parse tags JSON:', row.tags);
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
        tags: tags,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      });
    }

    return hands;
  }

  static async getHand(id: string): Promise<Hand | null> {
    if (!this.db) {throw new Error('Database not initialized');}

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

    // 解析 tags JSON
    let tags = [];
    try {
      if (row.tags && row.tags !== '[]') {
        tags = JSON.parse(row.tags);
      }
    } catch (error) {
      console.warn('Failed to parse tags JSON:', row.tags);
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
      tags: tags,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  static async insertHand(hand: Hand): Promise<void> {
    if (!this.db) {throw new Error('Database not initialized');}

    console.log('🗃️ DatabaseService.insertHand called with:', { id: hand.id, result: hand.result, sessionId: hand.sessionId });

    const sql = `
      INSERT INTO hands (id, session_id, details, result_amount, date, analysis, analysis_date, 
                        hole_cards, position, is_favorite, tag, board, note, villains, tags,
                        created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `;

    // 序列化 villains 和 tags
    const villainsJson = JSON.stringify(hand.villains || []);
    const tagsJson = JSON.stringify(hand.tags || []);

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
      tagsJson,
    ]);

    console.log('✅ DatabaseService.insertHand completed successfully');
  }

  static async updateHand(hand: Hand): Promise<void> {
    if (!this.db) {throw new Error('Database not initialized');}

    const sql = `
      UPDATE hands 
      SET session_id = ?, details = ?, result_amount = ?, date = ?, analysis = ?, analysis_date = ?,
          hole_cards = ?, position = ?, is_favorite = ?, tag = ?, board = ?, note = ?, villains = ?, tags = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    // 序列化 villains 和 tags
    const villainsJson = JSON.stringify(hand.villains || []);
    const tagsJson = JSON.stringify(hand.tags || []);

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
      tagsJson,
      hand.id,
    ]);
  }

  static async deleteHand(id: string): Promise<void> {
    if (!this.db) {throw new Error('Database not initialized');}

    await this.db.executeSql('DELETE FROM hands WHERE id = ?', [id]);
  }

  static async getHandsBySession(sessionId: string): Promise<Hand[]> {
    if (!this.db) {throw new Error('Database not initialized');}

    const [results] = await this.db.executeSql('SELECT * FROM hands WHERE session_id = ? ORDER BY updated_at DESC, created_at DESC', [sessionId]);
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
    if (!this.db) {throw new Error('Database not initialized');}

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
    if (!this.db) {throw new Error('Database not initialized');}

    await this.db.transaction(async (tx: any) => {
      for (const session of sessions) {
        const sql = `
          INSERT OR REPLACE INTO sessions (id, location, date, small_blind, big_blind, currency, effective_stack, buy_in, cash_out, cash_out_time, table_size, tag)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        await tx.executeSql(sql, [
          session.id,
          session.location,
          session.date,
          session.smallBlind,
          session.bigBlind,
          session.currency,
          session.effectiveStack,
          session.buyIn || null,
          session.cashOut || null,
          session.cashOutTime || null,
          session.tableSize || 6,
          session.tag || '',
        ]);
      }
    });
  }

  static async batchInsertHands(hands: Hand[]): Promise<void> {
    if (!this.db) {throw new Error('Database not initialized');}

    await this.db.transaction(async (tx: any) => {
      for (const hand of hands) {
        const sql = `
          INSERT OR REPLACE INTO hands (id, session_id, details, result_amount, date, analysis, analysis_date, 
                                      hole_cards, position, is_favorite, tag, board, note, villains,
                                      created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 
                  COALESCE(?, CURRENT_TIMESTAMP), CURRENT_TIMESTAMP)
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
          hand.createdAt || null, // 用於 COALESCE
        ]);
      }
    });
  }

  // ==================== 工具方法 ====================

  static async clearAllData(): Promise<void> {
    if (!this.db) {throw new Error('Database not initialized');}

    await this.db.executeSql('DELETE FROM hands');
    await this.db.executeSql('DELETE FROM sessions');
  }

  static async getDataStats(): Promise<{ sessionsCount: number; handsCount: number }> {
    if (!this.db) {throw new Error('Database not initialized');}

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
      this.isInitialized = false;
      this.isInitializing = false;
    }
  }
}
