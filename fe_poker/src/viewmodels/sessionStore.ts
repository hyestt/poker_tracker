import { create } from 'zustand';
import { Session, Hand, Stats } from '../models';
import { supabase } from '../config/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface State {
  sessions: Session[];
  hands: Hand[];
  stats: Stats;
  fetchSessions: () => Promise<void>;
  addSession: (session: Session) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  fetchHands: () => Promise<void>;
  addHand: (hand: Hand) => Promise<void>;
  deleteHand: (id: string) => Promise<void>;
  analyzeHand: (id: string) => Promise<string>;
  toggleFavorite: (id: string) => Promise<boolean>;
  fetchStats: () => Promise<void>;
  getHandsBySession: (sessionId: string) => Hand[];
  getHand: (id: string) => Promise<Hand>;
  updateHand: (hand: Hand) => Promise<void>;
  getSession: (id: string) => Promise<Session>;
  updateSession: (session: Session) => Promise<void>;
}

export const useSessionStore = create<State>((set, get) => ({
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

  fetchSessions: async () => {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const sessions: Session[] = data.map(session => ({
        id: session.id,
        location: session.location || '',
        date: session.date || '',
        smallBlind: session.small_blind || 0,
        bigBlind: session.big_blind || 0,
        currency: session.currency || '',
        effectiveStack: session.effective_stack || 0,
        tableSize: session.table_size || 6,
      }));
      
      set({ sessions });
      await AsyncStorage.setItem('poker_sessions', JSON.stringify(sessions));
    } catch (error) {
      console.error('Error fetching sessions:', error);
      const cached = await AsyncStorage.getItem('poker_sessions');
      if (cached) {
        set({ sessions: JSON.parse(cached) });
      }
    }
  },

  addSession: async (session: Session) => {
    try {
      const { error } = await supabase
        .from('sessions')
        .insert({
          id: session.id,
          location: session.location,
          date: session.date,
          small_blind: session.smallBlind,
          big_blind: session.bigBlind,
          currency: session.currency,
          effective_stack: session.effectiveStack,
          table_size: session.tableSize,
        });
      
      if (error) throw error;
      await get().fetchSessions();
    } catch (error) {
      console.error('Error adding session:', error);
      throw error;
    }
  },

  deleteSession: async (id: string) => {
    try {
      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      await get().fetchSessions();
    } catch (error) {
      console.error('Error deleting session:', error);
      throw error;
    }
  },

  fetchHands: async () => {
    try {
      const { data, error } = await supabase
        .from('hands')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const hands: Hand[] = data.map(hand => ({
        id: hand.id,
        sessionId: hand.session_id || '',
        position: hand.position || '',
        holeCards: hand.hole_cards || '',
        details: hand.details || '',
        result: hand.result_amount || 0,
        date: hand.created_at,
        analysis: hand.analysis || '',
        analysisDate: hand.analysis_date || '',
        favorite: hand.is_favorite || false,
      }));
      
      set({ hands });
      await AsyncStorage.setItem('poker_hands', JSON.stringify(hands));
    } catch (error) {
      console.error('Error fetching hands:', error);
      const cached = await AsyncStorage.getItem('poker_hands');
      if (cached) {
        set({ hands: JSON.parse(cached) });
      }
    }
  },

  addHand: async (hand: Hand) => {
    try {
      const { error } = await supabase
        .from('hands')
        .insert({
          id: hand.id,
          session_id: hand.sessionId,
          position: hand.position,
          hole_cards: hand.holeCards,
          details: hand.details,
          result_amount: hand.result,
          analysis: hand.analysis,
          analysis_date: hand.analysisDate,
          is_favorite: hand.favorite,
        });
      
      if (error) throw error;
      await get().fetchHands();
      await get().fetchStats();
    } catch (error) {
      console.error('Error adding hand:', error);
      throw error;
    }
  },

  deleteHand: async (id: string) => {
    try {
      const { error } = await supabase
        .from('hands')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      await get().fetchHands();
      await get().fetchStats();
    } catch (error) {
      console.error('Error deleting hand:', error);
      throw error;
    }
  },

  analyzeHand: async (id: string): Promise<string> => {
    try {
      // First get the hand
      const { data: handData, error: handError } = await supabase
        .from('hands')
        .select('*')
        .eq('id', id)
        .single();
      
      if (handError) throw handError;
      
      // Call OpenAI API directly (you'll need to implement this)
      // For now, return a placeholder
      const analysis = 'AI analysis would go here - you need to implement OpenAI API call';
      
      // Update the hand with analysis
      const { error: updateError } = await supabase
        .from('hands')
        .update({ 
          analysis,
          analysis_date: new Date().toISOString()
        })
        .eq('id', id);
      
      if (updateError) throw updateError;
      
      await get().fetchHands();
      return analysis;
    } catch (error) {
      console.error('Error analyzing hand:', error);
      throw error;
    }
  },

  fetchStats: async () => {
    try {
      const { data: hands, error } = await supabase
        .from('hands')
        .select('result_amount, session_id');
      
      if (error) throw error;
      
      const totalProfit = hands.reduce((sum, hand) => sum + (hand.result_amount || 0), 0);
      const totalSessions = new Set(hands.map(h => h.session_id)).size;
      const winRate = hands.filter(h => (h.result_amount || 0) > 0).length / hands.length * 100;
      const avgSession = totalSessions > 0 ? totalProfit / totalSessions : 0;
      
      const stats: Stats = {
        totalProfit,
        totalSessions,
        winRate: isNaN(winRate) ? 0 : winRate,
        avgSession,
        byStakes: {},
        byLocation: {},
      };
      
      set({ stats });
    } catch (error) {
      console.error('Error fetching stats:', error);
      set({
        stats: {
          totalProfit: 0,
          totalSessions: 0,
          winRate: 0,
          avgSession: 0,
          byStakes: {},
          byLocation: {},
        }
      });
    }
  },

  getHandsBySession: (sessionId: string) => 
    get().hands.filter((h: Hand) => h.sessionId === sessionId),

  getHand: async (id: string): Promise<Hand> => {
    try {
      const { data, error } = await supabase
        .from('hands')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
              return {
          id: data.id,
          sessionId: data.session_id || '',
          position: data.position || '',
          holeCards: data.hole_cards || '',
          details: data.details || '',
          result: data.result_amount || 0,
          date: data.created_at,
          analysis: data.analysis || '',
          analysisDate: data.analysis_date || '',
          favorite: data.is_favorite || false,
        };
    } catch (error) {
      console.error('Error getting hand:', error);
      throw error;
    }
  },

  updateHand: async (hand: Hand) => {
    try {
      const { error } = await supabase
        .from('hands')
        .update({
          session_id: hand.sessionId,
          position: hand.position,
          hole_cards: hand.holeCards,
          details: hand.details,
          result_amount: hand.result,
          analysis: hand.analysis,
          analysis_date: hand.analysisDate,
          is_favorite: hand.favorite,
        })
        .eq('id', hand.id);
      
      if (error) throw error;
      await get().fetchHands();
      await get().fetchStats();
    } catch (error) {
      console.error('Error updating hand:', error);
      throw error;
    }
  },

  getSession: async (id: string): Promise<Session> => {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      return {
        id: data.id,
        location: data.location || '',
        date: data.date || '',
        smallBlind: data.small_blind || 0,
        bigBlind: data.big_blind || 0,
        currency: data.currency || '',
        effectiveStack: data.effective_stack || 0,
        tableSize: data.table_size || 6,
      };
    } catch (error) {
      console.error('Error getting session:', error);
      throw error;
    }
  },

  updateSession: async (session: Session) => {
    try {
      const { error } = await supabase
        .from('sessions')
        .update({
          location: session.location,
          date: session.date,
          small_blind: session.smallBlind,
          big_blind: session.bigBlind,
          currency: session.currency,
          effective_stack: session.effectiveStack,
          table_size: session.tableSize,
        })
        .eq('id', session.id);
      
      if (error) throw error;
      await get().fetchSessions();
      await get().fetchStats();
    } catch (error) {
      console.error('Error updating session:', error);
      throw error;
    }
  },

  toggleFavorite: async (id: string): Promise<boolean> => {
    try {
      // First get current favorite status
      const { data: currentHand, error: fetchError } = await supabase
        .from('hands')
        .select('is_favorite')
        .eq('id', id)
        .single();
      
      if (fetchError) throw fetchError;
      
      const newFavoriteStatus = !currentHand.is_favorite;
      
      const { error: updateError } = await supabase
        .from('hands')
        .update({ is_favorite: newFavoriteStatus })
        .eq('id', id);
      
      if (updateError) throw updateError;
      
      await get().fetchHands();
      return newFavoriteStatus;
    } catch (error) {
      console.error('Error toggling favorite:', error);
      throw error;
    }
  },
})); 