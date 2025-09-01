import { Hand, Session } from '../models';
import { formatDate } from './dateFormat';

// 保留原始花色符號（♠ ♥ ♦ ♣），不轉換為英文
const keepCardSymbols = (cardString: string): string => {
  return cardString || '';
};

// 生成分階段詳情文字
const generateStageDetails = (hand: Hand): string => {
  const stages = [];
  
  // Preflop - 優先使用新欄位，否則使用舊欄位向後相容
  const preflopContent = hand.preflopDetails || (hand.details && !hand.preflopDetails && !hand.flopDetails && !hand.turnDetails && !hand.riverDetails ? hand.details : '');
  if (preflopContent) {
    stages.push(`Preflop: ${preflopContent}`);
  }
  
  // Flop
  if (hand.flopDetails) {
    stages.push(`Flop: ${hand.flopDetails}`);
  }
  
  // Turn  
  if (hand.turnDetails) {
    stages.push(`Turn: ${hand.turnDetails}`);
  }
  
  // River
  if (hand.riverDetails) {
    stages.push(`River: ${hand.riverDetails}`);
  }
  
  return stages.length > 0 ? stages.join('\n\n') : 'No details';
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
${generateStageDetails(hand)}

Note:
${hand.note || 'No note'}

Result: ${hand.result >= 0 ? '+' : ''}$${hand.result}

Shared from AI Solver`;
};


