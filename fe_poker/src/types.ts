// 定義應用中使用的所有類型

// 手牌記錄類型
export interface Hand {
  id: number;
  session_id: number;
  position: string;
  hole_cards: string;
  action: string;
  amount: number;
  result: number;
  villains?: string; // JSON字符串，存儲對手信息
  board?: string;
  note?: string;
  date: string;
  analysis?: string;
  analysis_date?: string;
  created_at?: string;
}

// 牌局類型
export interface Session {
  id: number;
  date: string;
  location: string;
  buy_in: number;
  cash_out: number;
  is_completed: boolean;
  created_at?: string;
}

// 對手類型
export interface Villain {
  id: string;
  cards?: string;
  position: string;
}

// 統計數據類型
export interface Stats {
  total_hands: number;
  total_sessions: number;
  total_profit: number;
  win_rate: number;
  biggest_win: number;
  biggest_loss: number;
  average_session_profit: number;
  best_position?: string;
  worst_position?: string;
  recent_trend: number[];
}

// 狀態通知類型
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

// 篩選條件類型
export interface FilterOptions {
  dateRange?: { start: string; end: string };
  positions?: string[];
  results?: 'win' | 'loss' | 'all';
  minAmount?: number;
  maxAmount?: number;
} 