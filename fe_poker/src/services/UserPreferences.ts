import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserPreferences {
  lastLocation: string;
  lastCurrency: string;
  lastTableSize: string;
  lastBlinds: string;
  customLocations: string[];
  customCurrencies: string[];
  customTableSizes: string[];
  customBlinds: string[];
}

const PREFERENCES_KEY = 'user_preferences';

const defaultPreferences: UserPreferences = {
  lastLocation: '',
  lastCurrency: '🇺🇸 USD',
  lastTableSize: '6',
  lastBlinds: '1/2',
  customLocations: ['Live Casino', 'Home Game', 'Online', 'Club'],
  customCurrencies: ['🇺🇸 USD', '🇪🇺 EUR', '🇬🇧 GBP', '🇯🇵 JPY', '🇨🇳 CNY'],
  customTableSizes: ['2', '4', '6', '8', '9', '10'],
  customBlinds: ['0.5/1', '1/2', '1/3', '2/5', '5/10', '10/20', '25/50'],
};

export const UserPreferencesService = {
  async getPreferences(): Promise<UserPreferences> {
    try {
      const stored = await AsyncStorage.getItem(PREFERENCES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with defaults to ensure all properties exist
        return { ...defaultPreferences, ...parsed };
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
  }): Promise<void> {
    try {
      const current = await this.getPreferences();
      const updated = {
        ...current,
        ...(choices.location && { lastLocation: choices.location }),
        ...(choices.currency && { lastCurrency: choices.currency }),
        ...(choices.tableSize && { lastTableSize: choices.tableSize }),
        ...(choices.blinds && { lastBlinds: choices.blinds }),
      };
      await this.savePreferences(updated);
    } catch (error) {
      console.error('Failed to update last choices:', error);
    }
  },

  async addCustomOption(type: keyof Pick<UserPreferences, 'customLocations' | 'customCurrencies' | 'customTableSizes' | 'customBlinds'>, option: string): Promise<void> {
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
}; 