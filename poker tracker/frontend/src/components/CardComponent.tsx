import React from 'react';
import { Box, styled } from '@mui/material';
import { CardRank, CardSuit } from '../models/types';

interface CardProps {
  suit: CardSuit;
  rank: CardRank;
  selected?: boolean;
  onClick?: () => void;
}

// 卡片容器
const CardContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'selected' && prop !== 'suit',
})<{ selected?: boolean, suit: CardSuit }>(({ theme, selected, suit }) => ({
  width: 40,
  height: 60,
  borderRadius: 6,
  border: `2px solid ${selected ? theme.palette.primary.main : '#ccc'}`,
  backgroundColor: '#fff',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  boxShadow: selected ? `0 0 5px ${theme.palette.primary.main}` : 'none',
  cursor: 'pointer',
  margin: 2,
  position: 'relative',
  color: suit === 'heart' || suit === 'diamond' ? '#e53935' : '#212121',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
  },
  transition: 'all 0.2s ease',
}));

// 卡片花色映射
const suitSymbols: Record<CardSuit, string> = {
  club: '♣',
  spade: '♠',
  heart: '♥',
  diamond: '♦',
};

// 卡片組件
const CardComponent: React.FC<CardProps> = ({ suit, rank, selected, onClick }) => {
  return (
    <CardContainer suit={suit} selected={selected} onClick={onClick}>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        fontWeight: 'bold',
      }}>
        <Box sx={{ fontSize: '14px' }}>{rank}</Box>
        <Box sx={{ fontSize: '18px' }}>{suitSymbols[suit]}</Box>
      </Box>
    </CardContainer>
  );
};

export default CardComponent; 