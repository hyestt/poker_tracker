// 撲克手牌記錄
export interface PokerHand {
  id?: number;
  location: string;
  buyIn: number;
  cashOut: number;
  result: number;
  startTime: string;
  endTime: string;
  notes: string;
  actions?: Action[];
  createdAt?: string;
  updatedAt?: string;
}

// 撲克動作記錄
export interface Action {
  id?: number;
  handId: number;
  stage: 'preflop' | 'flop' | 'turn' | 'river';
  actionType: 'bet' | 'call' | 'fold' | 'check' | 'raise' | 'all-in';
  amount: number;
  position: string;
  cards: string;
  createdAt?: string;
  updatedAt?: string;
}

// 統計資料
export interface Statistic {
  id?: number;
  totalHands: number;
  totalProfit: number;
  avgProfit: number;
  winRate: number;
  createdAt?: string;
  updatedAt?: string;
}

// 卡牌花色
export type CardSuit = 'club' | 'spade' | 'heart' | 'diamond';

// 卡牌點數
export type CardRank = 'A' | 'K' | 'Q' | 'J' | 'T' | '9' | '8' | '7' | '6' | '5' | '4' | '3' | '2';

// 卡牌
export interface Card {
  suit: CardSuit;
  rank: CardRank;
} 