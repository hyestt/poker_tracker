export interface Session {
  id: string;
  location: string;
  date: string;
  smallBlind: number;
  bigBlind: number;
  currency: string;
  effectiveStack: number;
  tableSize: number;
  tag: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Villain {
  id: string;
  holeCards?: string;
  position?: string;
}

export interface Hand {
  id: string;
  sessionId: string;
  position?: string;
  holeCards?: string;
  board?: string;
  details: string;
  note?: string;
  result: number;
  analysis?: string;
  analysisDate?: string;
  favorite: boolean;
  tag?: string;
  villains?: Villain[];
  date?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Stats {
  totalProfit: number;
  totalSessions: number;
  winRate: number;
  avgSession: number;
  byStakes: Record<string, number>;
  byLocation: Record<string, number>;
} 