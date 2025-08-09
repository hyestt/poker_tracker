import { Session, Hand, Villain } from '../models';
import { DatabaseService } from './DatabaseService';

const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export class WelcomeDemoService {
  private static readonly DEMO_SESSION_ID = 'welcome-demo-session';
  private static readonly DEMO_HAND_ID = 'welcome-demo-hand';

  static async createWelcomeData(): Promise<void> {
    try {
      await DatabaseService.initialize();
      console.log('🎉 Creating welcome demo data...');

      const demoSession = this.createDemoSession();
      const demoHand = this.createDemoHand();

      await DatabaseService.insertSession(demoSession);
      await DatabaseService.insertHand(demoHand);

      console.log('✅ Welcome demo data created successfully!');
    } catch (error) {
      console.error('❌ Failed to create welcome demo data:', error);
      throw error;
    }
  }

  static async recreateWelcomeData(): Promise<void> {
    try {
      await DatabaseService.initialize();
      console.log('🔄 Recreating welcome demo data...');

      // Delete existing demo data if it exists
      try {
        await DatabaseService.deleteHand(this.DEMO_HAND_ID);
        console.log('🗑️ Deleted existing demo hand');
      } catch (error) {
        console.log('No existing demo hand to delete');
      }

      try {
        await DatabaseService.deleteSession(this.DEMO_SESSION_ID);
        console.log('🗑️ Deleted existing demo session');
      } catch (error) {
        console.log('No existing demo session to delete');
      }

      // Create new demo data
      const demoSession = this.createDemoSession();
      const demoHand = this.createDemoHand();

      await DatabaseService.insertSession(demoSession);
      await DatabaseService.insertHand(demoHand);

      console.log('✅ Welcome demo data recreated successfully!');
    } catch (error) {
      console.error('❌ Failed to recreate welcome demo data:', error);
      throw error;
    }
  }

  private static createDemoSession(): Session {
    return {
      id: this.DEMO_SESSION_ID,
      location: 'Bellagio Casino',
      date: '2025-08-08T17:27:52.647Z',
      smallBlind: 1,
      bigBlind: 2,
      currency: 'USD',
      effectiveStack: 200,
      tableSize: 6,
      tag: 'demo',
      createdAt: '2025-08-08T17:27:52.647Z',
      updatedAt: '2025-08-08T17:27:52.647Z',
    };
  }

  private static createDemoHand(): Hand {
    const demoVillain: Villain = {
      id: 'demo-villain-1',
      holeCards: 'A♣ 6♣',
      position: 'UTG',
    };

    return {
      id: this.DEMO_HAND_ID,
      sessionId: this.DEMO_SESSION_ID,
      position: 'BTN',
      holeCards: 'A♠ K♠',
      board: 'A♥ 7♣ 2♦ 5♠ K♣',
      details: `Preflop: 
UTG Bet $6 UTG2 Call Hero Raise $25 UTG1 Call

Flop: 
UTG Check Hero Bet $25 UTG1 Call 

Turn: 
UTG Check Hero Check 

River: 
UTG Check Hero Bet $50 Villain Call`,
      note: 'Strong starting hand in position. Made two pair on river for solid value.',
      result: 205,
      analysis: this.getGTOAnalysis(),
      analysisDate: '2025-08-08T17:27:52.647Z',
      favorite: false,
      tag: 'welcome',
      villains: [demoVillain],
      date: '2025-08-08T17:27:52.647Z',
      createdAt: '2025-08-08T17:27:52.647Z',
      updatedAt: '2025-08-08T17:27:52.647Z',
    };
  }

  private static getGTOAnalysis(): string {
    return `## 1. Technical Analysis
- **Preflop**: Excellent 3-bet with A♠K♠ from the BTN. Raising to $25 against UTG's $6 open and the cold-caller is a premium play. This sizing (4x the original bet) builds the pot appropriately with a strong suited ace-king.
- **Flop (A♥7♣2♦)**: Perfect continuation bet of $25 into the $56 pot (roughly 45% pot size). You have top pair with the best kicker on this dry board and should bet for value against weaker aces and drawing hands.
- **Turn (5♠)**: The check is a reasonable line for pot control. With $106 in the pot, checking back allows bluff-catchers to stay in while avoiding building a massive pot with one pair.
- **River (K♣)**: Outstanding value bet! You improved to two pair and the $50 bet into $106 (roughly 47% pot size) is perfectly sized to extract value from weaker aces in villain's range.

## 2. Decision Evaluation
- **Preflop Sizing**: The $25 3-bet is well-sized against the $6 open and cold-caller, approximately 4x the original bet.
- **Flop Continuation**: The $25 bet represents good value with top pair top kicker on a dry board.
- **Turn Control**: Checking with one pair in a $106 pot shows excellent pot control.
- **River Value**: The $50 value bet after improving to two pair maximizes profit against villain's capped range.

## 3. Improvement Suggestions
- **Turn Alternative**: Could consider a smaller bet around $35-40 to extract thin value from weaker aces.
- **River Sizing**: The $50 bet is well-calibrated. Against loose opponents, could potentially bet $60-70 for maximum value.
- **Overall Execution**: This hand demonstrates excellent post-flop play with appropriate bet sizing throughout.

## 4. Learning Points
- **Bet Sizing**: Proper bet sizing relative to pot size (40-50%) extracts optimal value while maintaining fold equity.
- **Currency Awareness**: All bets are in actual dollar amounts ($6, $25, $50) rather than big blind multiples.
- **Value Extraction**: When improving from one pair to two pair on the river, betting for value is crucial against opponent's range of weaker aces.
- **Positional Play**: Button position allows for superior post-flop control and decision-making throughout all streets.`;
  }

  static async checkIfWelcomeDataExists(): Promise<boolean> {
    try {
      await DatabaseService.initialize();
      const session = await DatabaseService.getSession(this.DEMO_SESSION_ID);
      return !!session;
    } catch (error) {
      console.log('Welcome data does not exist, will create new');
      return false;
    }
  }
}
