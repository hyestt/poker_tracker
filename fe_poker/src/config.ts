// API配置文件
// 設置不同環境的API URL

// 開發環境: 本地開發時使用
const DEV_API_URL = 'http://192.168.1.28:8080';

// 生產環境: 使用Railway部署的API
const PROD_API_URL = 'https://poker-production-12db.up.railway.app';

// 根據環境變量選擇API URL
// 在本地開發時使用DEV_API_URL，在生產環境使用PROD_API_URL
const API_URL = __DEV__ ? DEV_API_URL : PROD_API_URL;

// 導出API基礎URL和相關端點
export default {
  BASE_URL: API_URL,
  ENDPOINTS: {
    HANDS: '/hands',
    SESSIONS: '/sessions',
    STATS: '/stats',
    ANALYZE: '/analyze',
  }
}; 