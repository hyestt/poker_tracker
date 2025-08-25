import { Hand, Session } from '../models';
import { formatDate } from './dateFormat';

// 將撲克牌符號轉換為完整英文表示
const convertCardSymbolsToEnglish = (cardString: string): string => {
  if (!cardString) return cardString;
  
  return cardString
    .replace(/♠/g, ' of spades')    // 黑桃 → of spades
    .replace(/♥/g, ' of hearts')    // 紅心 → of hearts  
    .replace(/♦/g, ' of diamonds')  // 方塊 → of diamonds
    .replace(/♣/g, ' of clubs');    // 梅花 → of clubs
};

// 生成用於分享的完整手牌文字
export const generateShareText = (hand: Hand, session: Session): string => {
  if (!hand || !session) {return '';}

  const villainText = hand.villains?.map((v, i) =>
    `Villain ${i + 1}: ${v.position || 'Unknown'} - ${convertCardSymbolsToEnglish(v.holeCards || 'Unknown')}`
  ).join('\n') || 'No villains';

  return `Poker Hand Details

Location: ${session.location}
Blinds: $${session.smallBlind}/$${session.bigBlind}
Date: ${formatDate(session.date)}

Hero: ${hand.position || 'Unknown'} - ${convertCardSymbolsToEnglish(hand.holeCards || 'Unknown')}
Board: ${convertCardSymbolsToEnglish(hand.board || 'No flop shown')}

Villains:
${villainText}

Hand Details:
${hand.details || 'No details'}

Note:
${hand.note || 'No note'}

Result: ${hand.result >= 0 ? '+' : ''}$${hand.result}

Shared from AI Solver`;
};


