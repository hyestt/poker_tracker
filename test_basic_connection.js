// 測試基本API連接
const API_URL = 'https://poker-production-12db.up.railway.app';

console.log('🔍 測試基本API連接...\n');

async function testBasicConnection() {
  try {
    // 測試最簡單的端點
    console.log('🌐 測試 /test 端點...');
    const testResponse = await fetch(`${API_URL}/test`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`狀態碼: ${testResponse.status}`);
    console.log(`狀態文字: ${testResponse.statusText}`);
    
    if (testResponse.ok) {
      const text = await testResponse.text();
      console.log('✅ 基本連接成功!');
      console.log('回應:', text);
      
      // 如果基本端點可用，再測試其他端點
      await testOtherEndpoints();
    } else {
      console.log('❌ 基本連接失敗');
      
      // 嘗試獲取錯誤詳情
      try {
        const errorText = await testResponse.text();
        console.log('錯誤詳情:', errorText);
      } catch (e) {
        console.log('無法獲取錯誤詳情');
      }
    }
    
  } catch (error) {
    console.error('❌ 連接錯誤:', error.message);
    console.log('\n💡 可能的原因:');
    console.log('- Railway服務未啟動或正在重啟');
    console.log('- 資料庫連接問題');
    console.log('- 編譯錯誤導致服務無法啟動');
    console.log('- 環境變數設定問題');
  }
}

async function testOtherEndpoints() {
  console.log('\n📋 測試其他端點...');
  
  const endpoints = ['/sessions', '/hands', '/stats'];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\n🔍 測試 ${endpoint}...`);
      const response = await fetch(`${API_URL}${endpoint}`);
      console.log(`狀態: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${endpoint} 成功 - 返回 ${JSON.stringify(data).length} 字符`);
      } else {
        console.log(`❌ ${endpoint} 失敗`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint} 錯誤:`, error.message);
    }
  }
}

testBasicConnection(); 