// API配置文件 - 暫時使用本地測試

const RAILWAY_URL = 'https://poker-production-12db.up.railway.app';
const LOCAL_IP = '192.168.1.11'; // 本地開發 IP

// 根據環境選擇 API URL
const getAPIUrl = (): string => {
  // 暫時使用本地 server 進行測試
  return `http://localhost:8080`;
  
  // 正式使用 Railway 生產環境時取消註解下一行
  // return RAILWAY_URL;
};

export const API_BASE_URL = getAPIUrl();
export const getAPIEndpoint = (endpoint: string) => `${API_BASE_URL}${endpoint}`;