// API配置文件 - 使用Railway生產環境

const RAILWAY_URL = 'https://poker-production-12db.up.railway.app';
const LOCAL_IP = '192.168.1.11'; // 本地開發 IP

// 根據環境選擇 API URL
const getAPIUrl = (): string => {
  // 使用 Railway 生產環境
  return RAILWAY_URL;
  
  // 本地開發時使用下面的設定
  // return `http://localhost:8080`;
  // return `http://${LOCAL_IP}:8080`;
};

export const API_BASE_URL = getAPIUrl();
export const getAPIEndpoint = (endpoint: string) => `${API_BASE_URL}${endpoint}`;