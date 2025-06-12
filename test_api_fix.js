// 測試修復後的API端點
const API_URL = 'https://poker-production-12db.up.railway.app';

console.log('🧪 測試修復後的API...\n');

async function testAPI() {
  try {
    // 測試 /stats 端點
    console.log('📊 測試 /stats 端點...');
    const statsResponse = await fetch(`${API_URL}/stats`);
    
    if (!statsResponse.ok) {
      throw new Error(`Stats API 錯誤: ${statsResponse.status} ${statsResponse.statusText}`);
    }
    
    const statsData = await statsResponse.json();
    console.log('✅ Stats API 成功!');
    console.log('數據:', JSON.stringify(statsData, null, 2));
    
    // 測試 /sessions 端點
    console.log('\n📋 測試 /sessions 端點...');
    const sessionsResponse = await fetch(`${API_URL}/sessions`);
    
    if (!sessionsResponse.ok) {
      throw new Error(`Sessions API 錯誤: ${sessionsResponse.status} ${sessionsResponse.statusText}`);
    }
    
    const sessionsData = await sessionsResponse.json();
    console.log('✅ Sessions API 成功!');
    console.log(`找到 ${sessionsData.length} 個session`);
    
    // 測試 /hands 端點
    console.log('\n🃏 測試 /hands 端點...');
    const handsResponse = await fetch(`${API_URL}/hands`);
    
    if (!handsResponse.ok) {
      throw new Error(`Hands API 錯誤: ${handsResponse.status} ${handsResponse.statusText}`);
    }
    
    const handsData = await handsResponse.json();
    console.log('✅ Hands API 成功!');
    console.log(`找到 ${handsData.length} 個手牌記錄`);
    
    console.log('\n🎉 所有API測試通過！');
    
  } catch (error) {
    console.error('❌ API測試失敗:', error.message);
    
    // 詳細錯誤處理
    if (error.message.includes('fetch')) {
      console.log('\n💡 可能的原因:');
      console.log('- Railway服務正在重啟中');
      console.log('- 網路連接問題');
      console.log('- CORS設定問題');
    }
  }
}

testAPI(); 