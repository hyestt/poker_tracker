export interface Session {
  id: string;
  location: string;
  date: string;
  smallBlind: number;
  bigBlind: number;
  currency: string;
  effectiveStack: number;
  tableSize?: number;
  tag?: string;
}

export interface Villain {
  id: string;
  holeCards?: string;
  position?: string;
}

export interface Hand {
  id: string;
  sessionId: string;
  holeCards?: string;
  board?: string;
  position?: string;
  details: string;
  note?: string;
  result: number;
  date: string;
  analysis?: string;
  analysisDate?: string;
  favorite?: boolean;
  villains?: Villain[];
}

export interface Stats {
  totalProfit: number;
  totalSessions: number;
  winRate: number;
  avgSession: number;
  byStakes: Record<string, number>;
  byLocation: Record<string, number>;
} 