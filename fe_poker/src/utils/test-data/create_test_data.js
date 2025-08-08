const { execSync } = require('child_process');

// 創建測試數據的 SQL 命令
const createTestData = () => {
  console.log('🎯 Creating 9 test hands...');
  
  const sessionId = Date.now().toString();
  const timestamp = new Date().toISOString();
  
  // 測試手牌數據
  const hands = [
    { holeCards: 'A♠ A♥', position: 'UTG', result: 50 },
    { holeCards: 'K♠ K♥', position: 'UTG+1', result: -10 },
    { holeCards: 'Q♠ Q♥', position: 'MP', result: 25 },
    { holeCards: 'J♠ J♥', position: 'HJ', result: -5 },
    { holeCards: 'T♠ T♥', position: 'CO', result: 15 },
    { holeCards: '9♠ 9♥', position: 'BTN', result: -20 },
    { holeCards: '8♠ 8♥', position: 'SB', result: 30 },
    { holeCards: '7♠ 7♥', position: 'BB', result: -15 },
    { holeCards: 'A♠ K♠', position: 'UTG', result: 40 }
  ];

  // 創建 SQL 插入語句
  let sql = `
-- 創建測試 session
INSERT OR REPLACE INTO sessions (id, location, date, small_blind, big_blind, currency, effective_stack, table_size, tag)
VALUES ('${sessionId}', 'Test Casino', '${timestamp}', 1, 2, 'USD', 200, 6, 'test');

`;

  // 創建手牌插入語句
  hands.forEach((hand, index) => {
    const handId = `test-hand-${Date.now()}-${index}`;
    const handTimestamp = new Date(Date.now() - (hands.length - index) * 60000).toISOString();
    
    sql += `
INSERT OR REPLACE INTO hands (id, session_id, hole_cards, board, position, details, note, result_amount, date, tag, is_favorite, villains)
VALUES ('${handId}', '${sessionId}', '${hand.holeCards}', '', '${hand.position}', 'Test hand ${index + 1}', 'Testing hand limit feature - Hand ${index + 1}', ${hand.result}, '${handTimestamp}', 'test', 0, '[]');
`;
  });

  return sql;
};

// 生成 SQL 並輸出
const sql = createTestData();
console.log(sql);
console.log('\n🎉 Test data SQL generated! Copy and run this in your SQLite database.');