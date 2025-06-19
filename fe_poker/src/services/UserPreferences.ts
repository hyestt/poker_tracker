import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserPreferences {
  lastLocation: string;
  lastCurrency: string;
  lastTableSize: string;
  lastBlinds: string;
  lastTag: string;
  customLocations: string[];
  customCurrencies: string[];
  customTableSizes: string[];
  customBlinds: string[];
  customTags: string[];
}

const PREFERENCES_KEY = 'user_preferences';

const defaultPreferences: UserPreferences = {
  lastLocation: '',
  lastCurrency: '🇺🇸 USD ($)',
  lastTableSize: '6',
  lastBlinds: '1/2',
  lastTag: '',
  customLocations: ['Live Casino', 'Home Game', 'Online', 'Club'],
  customCurrencies: [
    '🇺🇸 USD ($)',
    '🇪🇺 EUR (€)',
    '🇯🇵 JPY (¥)',
    '🇬🇧 GBP (£)',
    '🇨🇳 CNY (¥)',
    '🇦🇺 AUD ($)',
    '🇨🇦 CAD ($)',
    '🇨🇭 CHF (CHF)',
    '🇭🇰 HKD ($)',
    '🇸🇬 SGD ($)',
    '🇸🇪 SEK (kr)',
    '🇳🇴 NOK (kr)',
    '🇩🇰 DKK (kr)',
    '🇵🇱 PLN (zł)',
    '🇹🇼 TWD (NT$)',
    '🇳🇿 NZD ($)',
    '🇲🇽 MXN ($)',
    '🇮🇳 INR (₹)',
    '🇰🇷 KRW (₩)',
    '🇧🇷 BRL (R$)',
    '🇿🇦 ZAR (R)',
    '🇹🇷 TRY (₺)',
    '🇷🇺 RUB (₽)',
    '🇮🇱 ILS (₪)',
    '🇦🇪 AED (د.إ)',
    '🇸🇦 SAR (ر.س)',
    '🇹🇭 THB (฿)',
    '🇲🇾 MYR (RM)',
    '🇮🇩 IDR (Rp)',
    '🇵🇭 PHP (₱)',
    '🇻🇳 VND (₫)',
    '🇨🇿 CZK (Kč)',
    '🇭🇺 HUF (Ft)',
    '🇧🇬 BGN (лв)',
    '🇷🇴 RON (lei)',
    '🇦🇷 ARS ($)'
  ],
  customTableSizes: ['2', '4', '6', '8', '9', '10'],
  customBlinds: ['0.5/1', '1/2', '1/3', '2/5', '5/10', '10/20', '25/50'],
  customTags: ['Tournament', 'Cash Game', 'Deep Stack', 'Short Stack', 'Aggressive', 'Tight', 'Practice', 'Study'],
};

export const UserPreferencesService = {
  async getPreferences(): Promise<UserPreferences> {
    try {
      const stored = await AsyncStorage.getItem(PREFERENCES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // 總是使用最新的貨幣列表，但保留其他用戶設定
        const updated = {
          ...defaultPreferences,
          ...parsed,
          customCurrencies: defaultPreferences.customCurrencies, // 強制使用最新的貨幣列表
        };
        // 自動保存更新後的設定
        await this.savePreferences(updated);
        return updated;
      }
      return defaultPreferences;
    } catch (error) {
      console.error('Failed to load user preferences:', error);
      return defaultPreferences;
    }
  },

  async savePreferences(preferences: UserPreferences): Promise<void> {
    try {
      await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
    } catch (error) {
      console.error('Failed to save user preferences:', error);
    }
  },

  async updateLastChoices(choices: {
    location?: string;
    currency?: string;
    tableSize?: string;
    blinds?: string;
    tag?: string;
  }): Promise<void> {
    try {
      const current = await this.getPreferences();
      const updated = {
        ...current,
        ...(choices.location && { lastLocation: choices.location }),
        ...(choices.currency && { lastCurrency: choices.currency }),
        ...(choices.tableSize && { lastTableSize: choices.tableSize }),
        ...(choices.blinds && { lastBlinds: choices.blinds }),
        ...(choices.tag && { lastTag: choices.tag }),
      };
      await this.savePreferences(updated);
    } catch (error) {
      console.error('Failed to update last choices:', error);
    }
  },

  async addCustomOption(type: keyof Pick<UserPreferences, 'customLocations' | 'customCurrencies' | 'customTableSizes' | 'customBlinds' | 'customTags'>, option: string): Promise<void> {
    try {
      const current = await this.getPreferences();
      const currentArray = current[type] || [];
      if (!currentArray.includes(option)) {
        const updated = {
          ...current,
          [type]: [...currentArray, option],
        };
        await this.savePreferences(updated);
      }
    } catch (error) {
      console.error('Failed to add custom option:', error);
    }
  },

  async clearPreferences(): Promise<void> {
    try {
      await AsyncStorage.removeItem(PREFERENCES_KEY);
    } catch (error) {
      console.error('Failed to clear user preferences:', error);
    }
  },

  async resetToDefaults(): Promise<void> {
    try {
      await this.savePreferences(defaultPreferences);
    } catch (error) {
      console.error('Failed to reset preferences to defaults:', error);
    }
  },
}; 