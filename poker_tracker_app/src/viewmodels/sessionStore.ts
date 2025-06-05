import { create } from 'zustand';
import { Session, Hand, Stats } from '../models';

interface State {
  sessions: Session[];
  hands: Hand[];
  stats: Stats;
  addSession: (session: Session) => void;
  addHand: (hand: Hand) => void;
  getHandsBySession: (sessionId: string) => Hand[];
  calculateStats: () => void;
}

export const useSessionStore = create<State>((set: any, get: any) => ({
  sessions: [],
  hands: [],
  stats: {
    totalProfit: 0,
    totalSessions: 0,
    winRate: 0,
    avgSession: 0,
    byStakes: {},
    byLocation: {},
  },
  addSession: (session: Session) => set((state: State) => ({ sessions: [...state.sessions, session] })),
  addHand: (hand: Hand) => set((state: State) => ({ hands: [...state.hands, hand] })),
  getHandsBySession: (sessionId: string) => get().hands.filter((h: Hand) => h.sessionId === sessionId),
  calculateStats: () => {
    const { hands, sessions } = get();
    const totalProfit = hands.reduce((sum: number, h: Hand) => sum + h.result, 0);
    const totalSessions = sessions.length;
    const winSessions = sessions.filter((s: Session) => {
      const sessionHands = hands.filter((h: Hand) => h.sessionId === s.id);
      return sessionHands.reduce((sum: number, h: Hand) => sum + h.result, 0) > 0;
    }).length;
    const winRate = totalSessions ? Math.round((winSessions / totalSessions) * 100) : 0;
    const avgSession = totalSessions ? Math.round((totalProfit / totalSessions) * 100) / 100 : 0;
    // By Stakes
    const byStakes: Record<string, number> = {};
    sessions.forEach((s: Session) => {
      const key = `$${s.smallBlind}/${s.bigBlind}`;
      const sessionHands = hands.filter((h: Hand) => h.sessionId === s.id);
      byStakes[key] = (byStakes[key] || 0) + sessionHands.reduce((sum: number, h: Hand) => sum + h.result, 0);
    });
    // By Location
    const byLocation: Record<string, number> = {};
    sessions.forEach((s: Session) => {
      const sessionHands = hands.filter((h: Hand) => h.sessionId === s.id);
      byLocation[s.location] = (byLocation[s.location] || 0) + sessionHands.reduce((sum: number, h: Hand) => sum + h.result, 0);
    });
    set((state: State) => ({
      stats: {
        ...state.stats,
        totalProfit,
        totalSessions,
        winRate,
        avgSession,
        byStakes,
        byLocation,
      },
    }));
  },
})); 