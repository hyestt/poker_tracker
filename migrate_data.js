#!/usr/bin/env node

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// 數據庫文件路徑
const DB_PATH = './be_poker/poker_tracker.db';
const OUTPUT_DIR = './fe_poker/src/data';

// 確保輸出目錄存在
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function migrateData() {
  return new Promise((resolve, reject) => {
    console.log('🔄 開始數據遷移...');
    
    // 打開數據庫
    const db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('❌ 無法打開數據庫:', err.message);
        reject(err);
        return;
      }
      console.log('✅ 成功連接到數據庫');
    });

    let sessions = [];
    let hands = [];

    // 獲取 sessions 數據
    db.all('SELECT * FROM sessions ORDER BY date DESC', (err, rows) => {
      if (err) {
        console.error('❌ 獲取 sessions 失敗:', err.message);
        reject(err);
        return;
      }

      sessions = rows.map(row => ({
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
      }));

      console.log(`📊 獲取到 ${sessions.length} 個 sessions`);

      // 獲取 hands 數據
      db.all('SELECT * FROM hands ORDER BY date DESC', (err, rows) => {
        if (err) {
          console.error('❌ 獲取 hands 失敗:', err.message);
          reject(err);
          return;
        }

        hands = rows.map(row => ({
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
        }));

        console.log(`🃏 獲取到 ${hands.length} 個 hands`);

        // 保存數據到JSON文件
        const sessionsFile = path.join(OUTPUT_DIR, 'sessions.json');
        const handsFile = path.join(OUTPUT_DIR, 'hands.json');

        try {
          fs.writeFileSync(sessionsFile, JSON.stringify(sessions, null, 2));
          fs.writeFileSync(handsFile, JSON.stringify(hands, null, 2));
          
          console.log(`💾 Sessions 數據已保存到: ${sessionsFile}`);
          console.log(`💾 Hands 數據已保存到: ${handsFile}`);
          
          // 生成統計信息
          const stats = {
            totalSessions: sessions.length,
            totalHands: hands.length,
            migrationDate: new Date().toISOString(),
            locations: [...new Set(sessions.map(s => s.location).filter(Boolean))],
            currencies: [...new Set(sessions.map(s => s.currency).filter(Boolean))],
            dateRange: {
              earliest: sessions.length > 0 ? sessions[sessions.length - 1].date : null,
              latest: sessions.length > 0 ? sessions[0].date : null,
            }
          };
          
          const statsFile = path.join(OUTPUT_DIR, 'migration_stats.json');
          fs.writeFileSync(statsFile, JSON.stringify(stats, null, 2));
          console.log(`📈 統計信息已保存到: ${statsFile}`);
          
          console.log('\n🎉 數據遷移完成！');
          console.log(`📊 總計: ${stats.totalSessions} 個 sessions, ${stats.totalHands} 個 hands`);
          
        } catch (writeErr) {
          console.error('❌ 寫入文件失敗:', writeErr.message);
          reject(writeErr);
          return;
        }

        // 關閉數據庫連接
        db.close((err) => {
          if (err) {
            console.error('❌ 關閉數據庫失敗:', err.message);
          } else {
            console.log('✅ 數據庫連接已關閉');
          }
          resolve();
        });
      });
    });
  });
}

// 檢查數據庫文件是否存在
if (!fs.existsSync(DB_PATH)) {
  console.error(`❌ 數據庫文件不存在: ${DB_PATH}`);
  process.exit(1);
}

// 執行遷移
migrateData()
  .then(() => {
    console.log('✅ 遷移腳本執行完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 遷移失敗:', error);
    process.exit(1);
  }); 