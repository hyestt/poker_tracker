import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

const supabaseUrl = 'https://vdpscuywgjopwvcalgsn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkcHNjdXl3Z2pvcHd2Y2FsZ3NuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2MDY4MTEsImV4cCI6MjA2NTE4MjgxMX0.KlR7QQO_hgCaLS06wkwrR7wOP4cr24DeEdIjbq2Vzmc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      sessions: {
        Row: {
          id: string;
          location: string | null;
          date: string | null;
          small_blind: number | null;
          big_blind: number | null;
          currency: string | null;
          effective_stack: number | null;
          table_size: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          location?: string | null;
          date?: string | null;
          small_blind?: number | null;
          big_blind?: number | null;
          currency?: string | null;
          effective_stack?: number | null;
          table_size?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          location?: string | null;
          date?: string | null;
          small_blind?: number | null;
          big_blind?: number | null;
          currency?: string | null;
          effective_stack?: number | null;
          table_size?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      hands: {
        Row: {
          id: string;
          session_id: string | null;
          position: string | null;
          hole_cards: string | null;
          details: string | null;
          result_amount: number | null;
          analysis: string | null;
          analysis_date: string | null;
          is_favorite: boolean | null;
          tag: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          session_id?: string | null;
          position?: string | null;
          hole_cards?: string | null;
          details?: string | null;
          result_amount?: number | null;
          analysis?: string | null;
          analysis_date?: string | null;
          is_favorite?: boolean | null;
          tag?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string | null;
          position?: string | null;
          hole_cards?: string | null;
          details?: string | null;
          result_amount?: number | null;
          analysis?: string | null;
          analysis_date?: string | null;
          is_favorite?: boolean | null;
          tag?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}; 