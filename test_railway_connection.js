// 測試Railway API連接的腳本
const fetch = require('node-fetch');

// 替換為您的Railway應用的確切URL (從Railway dashboard獲取)
// 格式: https://服務名稱-用戶名稱.railway.app
const RAILWAY_URL = 'https://poker-production-12db.up.railway.app';

async function testConnection() {
  console.log('開始測試Railway API連接...');
  console.log(`使用URL: ${RAILWAY_URL}`);
  
  try {
    // 測試連接根端點
    console.log('\n測試 GET / 端點 (健康檢查)...');
    try {
      const rootResponse = await fetch(`${RAILWAY_URL}/`);
      console.log(`狀態碼: ${rootResponse.status}`);
      console.log(`回應: ${await rootResponse.text()}`);
    } catch (rootError) {
      console.log(`根端點錯誤: ${rootError.message}`);
    }
    
    // 測試獲取手牌資料
    console.log('\n測試 GET /hands 端點...');
    const handsResponse = await fetch(`${RAILWAY_URL}/hands`);
    
    console.log(`狀態碼: ${handsResponse.status}`);
    
    if (handsResponse.status === 500) {
      const errorText = await handsResponse.text();
      console.log(`錯誤詳情: ${errorText}`);
      throw new Error(`API錯誤: 500 Internal Server Error - ${errorText}`);
    }
    
    if (!handsResponse.ok) {
      throw new Error(`API錯誤: ${handsResponse.status} ${handsResponse.statusText}`);
    }
    
    const handsData = await handsResponse.json();
    console.log(`✅ 成功獲取手牌資料! 共有 ${handsData.length || 0} 筆記錄`);
    
    // 測試獲取牌局資料
    console.log('\n測試 GET /sessions 端點...');
    const sessionsResponse = await fetch(`${RAILWAY_URL}/sessions`);
    
    if (!sessionsResponse.ok) {
      throw new Error(`API錯誤: ${sessionsResponse.status} ${sessionsResponse.statusText}`);
    }
    
    const sessionsData = await sessionsResponse.json();
    console.log(`✅ 成功獲取牌局資料! 共有 ${sessionsData.length || 0} 筆記錄`);
    
    console.log('\n✅✅✅ 所有測試通過! Railway API連接正常 ✅✅✅');
    console.log(`您可以在瀏覽器中訪問: ${RAILWAY_URL}/hands 查看API返回的數據`);
    
  } catch (error) {
    console.error('\n❌ 連接測試失敗!');
    console.error(error);
    console.log('');
    console.log('可能的原因:');
    console.log('1. Railway應用未成功部署');
    console.log('2. URL不正確 - 請確認Railway Dashboard中的域名');
    console.log('3. 後端服務尚未啟動');
    console.log('4. 資料庫連接問題');
    console.log('5. 資料庫表結構未初始化');
    console.log('');
    console.log('解決方法:');
    console.log('1. 檢查Railway部署日誌');
    console.log('2. 確認環境變數設置正確');
    console.log('3. 在PostgreSQL服務中初始化資料庫結構');
    console.log('4. 重新部署應用');
  }
}

// 執行測試
testConnection(); 