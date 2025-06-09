import { useState, useCallback } from 'react';

export interface PokerCard {
  rank: string;
  suit: string;
  display: string;
}

export interface PokerKeyboardState {
  selectedAction: 'hole' | 'position';
  selectedRank: string | null;
  selectedSuit: string | null;
  inputCards: PokerCard[];
  maxCards: number;
}

export interface PokerKeyboardViewModel {
  state: PokerKeyboardState;
  actions: {
    setSelectedAction: (action: 'hole' | 'position') => void;
    selectRank: (rank: string) => void;
    selectSuit: (suit: string) => void;
    addCard: (rank: string, suit: string) => void;
    clearAll: () => void;
    removeCard: (index: number) => void;
    canAddCard: () => boolean;
    isCardSelected: (rank: string, suit: string) => boolean;
  };
}

export const usePokerKeyboardViewModel = (
  initialAction: 'hole' | 'position' = 'hole',
  maxCards: number = 2
): PokerKeyboardViewModel => {
  const [state, setState] = useState<PokerKeyboardState>({
    selectedAction: initialAction,
    selectedRank: null,
    selectedSuit: null,
    inputCards: [],
    maxCards,
  });

  const setSelectedAction = useCallback((action: 'hole' | 'position') => {
    setState(prev => ({ 
      ...prev, 
      selectedAction: action,
      maxCards: action === 'hole' ? 2 : 1
    }));
  }, []);

  const selectRank = useCallback((rank: string) => {
    setState(prev => ({ ...prev, selectedRank: rank }));
  }, []);

  const selectSuit = useCallback((suit: string) => {
    setState(prev => ({ ...prev, selectedSuit: suit }));
  }, []);

  const addCard = useCallback((rank: string, suit: string) => {
    setState(prev => {
      // 檢查是否已達到最大張數
      if (prev.inputCards.length >= prev.maxCards) {
        return prev;
      }

      // 檢查是否已經選過相同的牌
      const cardExists = prev.inputCards.some(
        card => card.rank === rank && card.suit === suit
      );
      
      if (cardExists) {
        return prev;
      }

      const newCard: PokerCard = {
        rank,
        suit,
        display: `${rank}${suit}`
      };

      return {
        ...prev,
        inputCards: [...prev.inputCards, newCard],
        selectedRank: null,
        selectedSuit: null,
      };
    });
  }, []);

  const clearAll = useCallback(() => {
    setState(prev => ({
      ...prev,
      inputCards: [],
      selectedRank: null,
      selectedSuit: null,
    }));
  }, []);

  const removeCard = useCallback((index: number) => {
    setState(prev => ({
      ...prev,
      inputCards: prev.inputCards.filter((_, i) => i !== index),
    }));
  }, []);

  const canAddCard = useCallback(() => {
    return state.inputCards.length < state.maxCards;
  }, [state.inputCards.length, state.maxCards]);

  const isCardSelected = useCallback((rank: string, suit: string) => {
    return state.inputCards.some(
      card => card.rank === rank && card.suit === suit
    );
  }, [state.inputCards]);

  return {
    state,
    actions: {
      setSelectedAction,
      selectRank,
      selectSuit,
      addCard,
      clearAll,
      removeCard,
      canAddCard,
      isCardSelected,
    },
  };
}; 