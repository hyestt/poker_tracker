import React from 'react';
import { PokerKeyboardView } from '../components/PokerKeyboardView';

interface PokerKeyboardScreenProps {
  navigation: any;
  route: any;
}

export const PokerKeyboardScreen: React.FC<PokerKeyboardScreenProps> = ({ navigation, route }) => {
  const { onCardsSelected, initialAction = 'hole' } = route.params || {};

  const handleBack = () => {
    navigation.goBack();
  };

  const handleSave = () => {
    // 這裡可以執行儲存邏輯
    navigation.goBack();
  };

  const handleCardSelect = (cards: string[]) => {
    if (onCardsSelected) {
      onCardsSelected(cards);
    }
  };

  return (
    <PokerKeyboardView
      onBack={handleBack}
      onSave={handleSave}
      onCardSelect={handleCardSelect}
      initialAction={initialAction}
    />
  );
}; 