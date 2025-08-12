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
      buyIn: 200,
      cashOut: 100,
      cashOutTime: '2025-08-08T20:30:00.000Z',
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
    return `
**Summary**
Overall: ⭐⭐

The hand shows some solid plays but also significant deviations from GTO strategy, particularly on the turn. The turn check was a missed opportunity to extract value. To improve, consider betting more frequently on the turn with strong hands and adjusting sizing to maximize value.

## Preflop  
**Player Action:** 
Hero is in the BTN position holding A♠ K♠. After UTG opens for $6 and UTG2 calls, Hero raises to $25.

**GTO Recommendation:** 
Raising with A♠ K♠ from the BTN is a high-frequency action. The recommended range includes raising with strong hands and some suited connectors. A typical sizing would be around 2.5-3x the initial raise, which aligns with Hero's action.

**Rating & Summary:** 
⭐⭐⭐⭐⭐ Comments  
This is a strong preflop play, capitalizing on position and hand strength. The sizing is appropriate, and the action is consistent with GTO principles.

## Flop  
**Player Action:** 
The flop comes A♦ 7♣. UTG checks, and Hero bets $25. UTG1 calls.

**GTO Recommendation:** 
On this flop, betting with top pair (A♠ K♠) is standard. A continuation bet is recommended, especially against two opponents, to protect equity and extract value.

**Rating & Summary:** 
⭐⭐⭐⭐⭐ Comments
Hero's action on the flop is solid, maintaining aggression with a strong hand. The bet size is appropriate for the board.

## Turn  
**Player Action:** 
The turn is a blank, and both UTG and Hero check.

**GTO Recommendation:** 
Checking on the turn with top pair is a deviation from GTO. Hero should consider betting to extract value from weaker hands and protect against potential draws. 

**Rating & Summary:** 
⭐⭐ Comments
This check is a small mistake. Hero should have continued betting to maximize value and apply pressure on opponents.

## River  
**Player Action:** 
The river is also a blank. UTG checks, and Hero bets $50. Villain calls.

**GTO Recommendation:** 
Betting on the river is a good move, as Hero still has the best hand. The sizing is reasonable, aiming to extract value from weaker Aces or other hands that might call.

**Rating & Summary:** 
⭐⭐⭐⭐ Comments
Hero's river bet is a solid play, capitalizing on the strength of the hand.`;
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
