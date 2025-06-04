import React, { useState } from 'react';
import { Box, Grid, Typography, Paper, styled } from '@mui/material';
import CardComponent from './CardComponent';
import { CardRank, CardSuit } from '../models/types';

interface CardSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

// 容器樣式
const SelectorContainer = styled(Paper)(({ theme }) => ({
  padding: 16,
  borderRadius: 12,
  backgroundColor: '#f8f9fa',
  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
  margin: '16px 0',
}));

// 牌面容器
const CardSection = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  marginBottom: 16,
}));

// 花色容器
const SuitsContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-around',
  width: '100%',
  marginTop: 8,
}));

// 花色按鈕
const SuitButton = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'selected' && prop !== 'suitColor',
})<{ selected: boolean; suitColor: string }>(({ theme, selected, suitColor }) => ({
  width: 50,
  height: 50,
  borderRadius: '50%',
  backgroundColor: selected ? suitColor : '#e0e0e0',
  color: selected ? '#fff' : '#757575',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  cursor: 'pointer',
  fontSize: 24,
  transition: 'all 0.2s ease',
  '&:hover': {
    transform: 'scale(1.05)',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
}));

// 牌面選擇器組件
const CardSelector: React.FC<CardSelectorProps> = ({ value, onChange }) => {
  // 解析初始值
  const [selectedCards, setSelectedCards] = useState<string[]>(value ? value.split('') : []);
  const [selectedSuit, setSelectedSuit] = useState<CardSuit>('heart');

  // 花色映射
  const suits: { suit: CardSuit; symbol: string; color: string }[] = [
    { suit: 'club', symbol: '♣', color: '#4CAF50' },
    { suit: 'spade', symbol: '♠', color: '#212121' },
    { suit: 'heart', symbol: '♥', color: '#F44336' },
    { suit: 'diamond', symbol: '♦', color: '#9C27B0' },
  ];

  // 點數列表
  const ranks: CardRank[] = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];

  // 處理卡片選擇
  const handleCardSelect = (rank: CardRank) => {
    const card = `${rank}${selectedSuit.charAt(0)}`;
    const newSelectedCards = [...selectedCards];
    
    // 檢查是否已選擇
    const index = newSelectedCards.indexOf(card);
    if (index !== -1) {
      newSelectedCards.splice(index, 1);
    } else if (newSelectedCards.length < 2) {
      newSelectedCards.push(card);
    }
    
    setSelectedCards(newSelectedCards);
    onChange(newSelectedCards.join(''));
  };

  // 處理花色選擇
  const handleSuitSelect = (suit: CardSuit) => {
    setSelectedSuit(suit);
  };

  // 獲取卡片花色
  const getSuitFromCard = (card: string): CardSuit => {
    const suitChar = card.charAt(1);
    if (suitChar === 'c') return 'club';
    if (suitChar === 's') return 'spade';
    if (suitChar === 'h') return 'heart';
    return 'diamond';
  };

  // 獲取卡片點數
  const getRankFromCard = (card: string): CardRank => {
    return card.charAt(0) as CardRank;
  };

  // 檢查卡片是否被選中
  const isCardSelected = (rank: CardRank, suit: CardSuit): boolean => {
    const card = `${rank}${suit.charAt(0)}`;
    return selectedCards.includes(card);
  };

  return (
    <SelectorContainer>
      <CardSection>
        <Typography variant="h6" gutterBottom>
          選擇手牌
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          {selectedCards.map((card, index) => (
            <CardComponent
              key={index}
              suit={getSuitFromCard(card)}
              rank={getRankFromCard(card)}
              selected
            />
          ))}
          {selectedCards.length === 0 && (
            <>
              <CardComponent suit="spade" rank="A" selected={false} />
              <CardComponent suit="spade" rank="K" selected={false} />
            </>
          )}
          {selectedCards.length === 1 && (
            <CardComponent suit="spade" rank="K" selected={false} />
          )}
        </Box>
      </CardSection>

      <SuitsContainer>
        {suits.map((s) => (
          <SuitButton
            key={s.suit}
            selected={selectedSuit === s.suit}
            suitColor={s.color}
            onClick={() => handleSuitSelect(s.suit)}
          >
            {s.symbol}
          </SuitButton>
        ))}
      </SuitsContainer>

      <Grid container spacing={1} sx={{ mt: 2 }}>
        {ranks.map((rank) => (
          <Grid key={rank} item xs={3} sm={2} md={1}>
            <CardComponent
              suit={selectedSuit}
              rank={rank}
              selected={isCardSelected(rank, selectedSuit)}
              onClick={() => handleCardSelect(rank)}
            />
          </Grid>
        ))}
      </Grid>
    </SelectorContainer>
  );
};

export default CardSelector; 