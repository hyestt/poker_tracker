import { Hand, Session } from '../models';
import { formatDate } from './dateFormat';

// 保留原始花色符號（♠ ♥ ♦ ♣），不轉換為英文
const keepCardSymbols = (cardString: string): string => {
  return cardString || '';
};

// 生成用於分享的完整手牌文字
export const generateShareText = (hand: Hand, session: Session): string => {
  if (!hand || !session) {return '';}

  const villainText = hand.villains?.map((v, i) =>
    `Villain ${i + 1}: ${v.position || 'Unknown'} - ${keepCardSymbols(v.holeCards || 'Unknown')}`
  ).join('\n') || 'No villains';

  return `Poker Hand Details

Location: ${session.location}
Blinds: $${session.smallBlind}/$${session.bigBlind}
Date: ${formatDate(session.date)}

Hero: ${hand.position || 'Unknown'} - ${keepCardSymbols(hand.holeCards || 'Unknown')}
Board: ${keepCardSymbols(hand.board || 'No flop shown')}

Villains:
${villainText}

Hand Details:
${hand.details || 'No details'}

Note:
${hand.note || 'No note'}

Result: ${hand.result >= 0 ? '+' : ''}$${hand.result}

Shared from AI Solver`;
};


