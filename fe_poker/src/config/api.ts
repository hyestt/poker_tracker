// API配置文件

// 讀取當前的本機IP（由start.sh自動設定到.env）
// 如果.env文件不存在或無法讀取，則使用localhost作為fallback
const getCurrentIP = (): string => {
  // 這個值會由start.sh腳本自動設定到環境變數中
  // 目前直接使用檢測到的IP
  return '192.168.1.28'; // 這會由start.sh動態更新
};

export const API_BASE_URL = `http://${getCurrentIP()}:8080`;
export const getAPIUrl = (endpoint: string) => `${API_BASE_URL}${endpoint}`;