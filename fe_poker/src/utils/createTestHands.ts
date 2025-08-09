import { DatabaseService } from '../services/DatabaseService';

// 生成 UUID
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const createTestHands = async (): Promise<void> => {
  try {
    await DatabaseService.initialize();
    console.log('✅ Database initialized');

    // 創建測試 session
    const sessionId = Date.now().toString();
    const testSession = {
      id: sessionId,
      location: 'Test Casino',
      date: new Date().toISOString(),
      smallBlind: 1,
      bigBlind: 2,
      currency: 'USD',
      effectiveStack: 200,
      tableSize: 6,
      tag: 'test',
    };

    await DatabaseService.insertSession(testSession);
    console.log('✅ Test session created:', sessionId);

    // 創建 9 手測試手牌
    const hands = [
      { holeCards: 'A♠ A♥', position: 'UTG', result: 50 },
      { holeCards: 'K♠ K♥', position: 'UTG+1', result: -10 },
      { holeCards: 'Q♠ Q♥', position: 'MP', result: 25 },
      { holeCards: 'J♠ J♥', position: 'HJ', result: -5 },
      { holeCards: 'T♠ T♥', position: 'CO', result: 15 },
      { holeCards: '9♠ 9♥', position: 'BTN', result: -20 },
      { holeCards: '8♠ 8♥', position: 'SB', result: 30 },
      { holeCards: '7♠ 7♥', position: 'BB', result: -15 },
      { holeCards: 'A♠ K♠', position: 'UTG', result: 40 },
    ];

    for (let i = 0; i < hands.length; i++) {
      const hand = hands[i];
      const testHand = {
        id: generateUUID(),
        sessionId: sessionId,
        holeCards: hand.holeCards,
        board: '',
        position: hand.position,
        details: `Test hand ${i + 1}`,
        note: `Testing hand limit feature - Hand ${i + 1}`,
        result: hand.result,
        date: new Date(Date.now() - (hands.length - i) * 60000).toISOString(),
        villains: [],
        favorite: false,
        tag: 'test',
      };

      await DatabaseService.insertHand(testHand);
      console.log(`✅ Test hand ${i + 1} created: ${hand.holeCards} (${hand.result})`);
    }

    console.log(`\n🎉 Successfully created ${hands.length} test hands!`);
    console.log('📊 You can now test the 10-hand limit by trying to add one more hand.');

  } catch (error) {
    console.error('❌ Error creating test data:', error);
    throw error;
  }
};
