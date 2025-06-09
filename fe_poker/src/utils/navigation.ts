export const navigateToPokerKeyboard = (
  navigation: any,
  onCardsSelected: (cards: string[]) => void,
  initialAction: 'hole' | 'position' = 'hole'
) => {
  navigation.navigate('PokerKeyboard', {
    onCardsSelected,
    initialAction,
  });
};

export const navigateToPokerKeyboardModal = (
  navigation: any,
  onCardsSelected: (cards: string[]) => void,
  initialAction: 'hole' | 'position' = 'hole'
) => {
  navigation.navigate('PokerKeyboard', {
    onCardsSelected: (cards: string[]) => {
      onCardsSelected(cards);
      navigation.goBack();
    },
    initialAction,
  });
}; 