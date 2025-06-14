import analytics from '@react-native-firebase/analytics';

export class FirebaseAnalyticsService {
  // 記錄自定義事件
  static async logEvent(eventName: string, parameters?: { [key: string]: any }) {
    try {
      await analytics().logEvent(eventName, parameters);
      console.log(`Analytics event logged: ${eventName}`, parameters);
    } catch (error) {
      console.error('Error logging analytics event:', error);
    }
  }

  // 記錄屏幕瀏覽
  static async logScreenView(screenName: string, screenClass?: string) {
    try {
      await analytics().logScreenView({
        screen_name: screenName,
        screen_class: screenClass || screenName,
      });
      console.log(`Screen view logged: ${screenName}`);
    } catch (error) {
      console.error('Error logging screen view:', error);
    }
  }

  // 設置用戶屬性
  static async setUserProperty(name: string, value: string) {
    try {
      await analytics().setUserProperty(name, value);
      console.log(`User property set: ${name} = ${value}`);
    } catch (error) {
      console.error('Error setting user property:', error);
    }
  }

  // 設置用戶ID
  static async setUserId(userId: string) {
    try {
      await analytics().setUserId(userId);
      console.log(`User ID set: ${userId}`);
    } catch (error) {
      console.error('Error setting user ID:', error);
    }
  }

  // 記錄遊戲相關事件
  static async logGameEvent(eventType: 'game_start' | 'game_end' | 'hand_played', gameData?: any) {
    await this.logEvent(eventType, gameData);
  }

  // 記錄購買事件
  static async logPurchase(value: number, currency: string = 'USD', itemId?: string) {
    await this.logEvent('purchase', {
      value,
      currency,
      item_id: itemId,
    });
  }
} 