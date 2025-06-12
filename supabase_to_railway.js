// Supabase到Railway PostgreSQL資料遷移工具
const fetch = require('node-fetch');

// ===== 配置 =====
// Supabase API (原始資料來源)
const SUPABASE_URL = 'https://vdpscuywgjopwvcalgsn.supabase.co';
const SUPABASE_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkcHNjdXl3Z2pvcHd2Y2FsZ3NuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDU3NjUyNDIsImV4cCI6MjAyMTM0MTI0Mn0.QGQwlZOwFYmgIr9TWzeBp2_CV80Z3Q-VZ3YjkKEXK34'; // 這是公開的anon key，可以安全分享

// Railway API (目標)
const RAILWAY_URL = 'https://poker-production-12db.up.railway.app';

// ===== 功能實現 =====

// 從Supabase獲取所有牌局
async function fetchSessionsFromSupabase() {
  console.log('從Supabase獲取牌局資料...');
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/sessions?select=*`, {
      headers: {
        'apikey': SUPABASE_API_KEY,
        'Authorization': `Bearer ${SUPABASE_API_KEY}`,
      }
    });
    
    if (!response.ok) {
      throw new Error(`Supabase API錯誤: ${response.status}`);
    }
    
    const sessions = await response.json();
    console.log(`✅ 從Supabase獲取了 ${sessions.length} 個牌局`);
    return sessions;
  } catch (error) {
    console.error('❌ 獲取Supabase牌局失敗:', error);
    return [];
  }
}

// 從Supabase獲取所有手牌
async function fetchHandsFromSupabase() {
  console.log('從Supabase獲取手牌資料...');
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/hands?select=*`, {
      headers: {
        'apikey': SUPABASE_API_KEY,
        'Authorization': `Bearer ${SUPABASE_API_KEY}`,
      }
    });
    
    if (!response.ok) {
      throw new Error(`Supabase API錯誤: ${response.status}`);
    }
    
    const hands = await response.json();
    console.log(`✅ 從Supabase獲取了 ${hands.length} 個手牌記錄`);
    return hands;
  } catch (error) {
    console.error('❌ 獲取Supabase手牌失敗:', error);
    return [];
  }
}

// 將牌局資料寫入Railway
async function insertSessionsToRailway(sessions) {
  console.log('開始遷移牌局資料到Railway...');
  
  for (const session of sessions) {
    try {
      // 格式化為後端期望的格式
      const formattedSession = {
        id: session.id,
        date: session.date,
        location: session.location,
        buy_in: session.buy_in,
        cash_out: session.cash_out,
        is_completed: session.is_completed
      };
      
      const response = await fetch(`${RAILWAY_URL}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formattedSession)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Railway API錯誤: ${response.status} - ${errorText}`);
      }
      
      console.log(`✅ 成功遷移牌局 #${session.id}: ${session.location} (${session.date})`);
    } catch (error) {
      console.error(`❌ 遷移牌局 #${session.id} 失敗:`, error.message);
    }
  }
  
  console.log('牌局資料遷移完成!');
}

// 將手牌資料寫入Railway
async function insertHandsToRailway(hands) {
  console.log('開始遷移手牌資料到Railway...');
  
  for (const hand of hands) {
    try {
      // 格式化為後端期望的格式
      const formattedHand = {
        id: hand.id,
        session_id: hand.session_id,
        position: hand.position,
        hole_cards: hand.hole_cards,
        action: hand.action,
        amount: hand.amount,
        result: hand.result,
        villains: hand.villains || '[]',
        board: hand.board || '',
        note: hand.note || '',
        date: hand.date,
        analysis: hand.analysis || '',
        analysis_date: hand.analysis_date || ''
      };
      
      const response = await fetch(`${RAILWAY_URL}/hands`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formattedHand)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Railway API錯誤: ${response.status} - ${errorText}`);
      }
      
      console.log(`✅ 成功遷移手牌 #${hand.id}: ${hand.hole_cards} (${hand.date})`);
    } catch (error) {
      console.error(`❌ 遷移手牌 #${hand.id} 失敗:`, error.message);
    }
  }
  
  console.log('手牌資料遷移完成!');
}

// 驗證遷移結果
async function verifyMigration() {
  console.log('驗證遷移結果...');
  
  try {
    // 檢查Railway牌局數據
    const sessionsResponse = await fetch(`${RAILWAY_URL}/sessions`);
    if (!sessionsResponse.ok) {
      throw new Error(`Railway sessions API錯誤: ${sessionsResponse.status}`);
    }
    const railwaySessions = await sessionsResponse.json();
    
    // 檢查Railway手牌數據
    const handsResponse = await fetch(`${RAILWAY_URL}/hands`);
    if (!handsResponse.ok) {
      throw new Error(`Railway hands API錯誤: ${handsResponse.status}`);
    }
    const railwayHands = await handsResponse.json();
    
    console.log('\n===== 遷移結果 =====');
    console.log(`Railway牌局數量: ${railwaySessions.length}`);
    console.log(`Railway手牌數量: ${railwayHands.length}`);
    
    return {
      sessions: railwaySessions.length,
      hands: railwayHands.length
    };
  } catch (error) {
    console.error('❌ 驗證失敗:', error);
    return { sessions: 0, hands: 0 };
  }
}

// 主函數
async function migrateData() {
  console.log('===== Supabase到Railway資料遷移工具 =====');
  
  try {
    // 1. 獲取Supabase數據
    const supabaseSessions = await fetchSessionsFromSupabase();
    const supabaseHands = await fetchHandsFromSupabase();
    
    if (supabaseSessions.length === 0 || supabaseHands.length === 0) {
      throw new Error('無法從Supabase獲取資料');
    }
    
    // 2. 遷移到Railway
    await insertSessionsToRailway(supabaseSessions);
    await insertHandsToRailway(supabaseHands);
    
    // 3. 驗證結果
    const results = await verifyMigration();
    
    // 4. 總結
    console.log('\n===== 遷移總結 =====');
    console.log(`Supabase牌局: ${supabaseSessions.length} => Railway牌局: ${results.sessions}`);
    console.log(`Supabase手牌: ${supabaseHands.length} => Railway手牌: ${results.hands}`);
    
    if (results.sessions === supabaseSessions.length && results.hands === supabaseHands.length) {
      console.log('🎉 遷移成功! 所有資料已成功轉移到Railway.');
    } else {
      console.log('⚠️ 遷移部分成功. 請檢查日誌了解詳情.');
    }
    
  } catch (error) {
    console.error('❌ 遷移過程中出錯:', error);
  }
}

// 執行遷移
migrateData(); 