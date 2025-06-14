// API配置文件 - 使用本地開發環境

const RAILWAY_URL = 'https://poker-production-12db.up.railway.app';
const LOCAL_IP = '192.168.1.28'; // 本地開發 IP (更新為正確的IP)

// 根據環境選擇 API URL
const getAPIUrl = (): string => {
  // 使用本地開發環境
  return `http://${LOCAL_IP}:8080`;
  
  // Railway 生產環境 (暫時停用)
  // return RAILWAY_URL;
  
  // 本地localhost (備用選項)
  // return `http://localhost:8080`;
};

export const API_BASE_URL = getAPIUrl();
export const getAPIEndpoint = (endpoint: string) => `${API_BASE_URL}${endpoint}`;