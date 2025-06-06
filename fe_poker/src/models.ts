export interface Session {
  id: string;
  location: string;
  date: string;
  smallBlind: number;
  bigBlind: number;
  currency: string;
  effectiveStack: number;
}

export interface Hand {
  id: string;
  sessionId: string;
  details: string;
  result: number;
  date: string;
  analysis?: string;
  analysisDate?: string;
}

export interface Stats {
  totalProfit: number;
  totalSessions: number;
  winRate: number;
  avgSession: number;
  byStakes: Record<string, number>;
  byLocation: Record<string, number>;
} 