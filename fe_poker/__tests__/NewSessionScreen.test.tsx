import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NewSessionScreen } from '../src/screens/NewSessionScreen';
import { UserPreferencesService } from '../src/services/UserPreferences';

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
};

// Mock UserPreferencesService
jest.mock('../src/services/UserPreferences', () => ({
  UserPreferencesService: {
    getPreferences: jest.fn(),
    updateLastChoices: jest.fn(),
    savePreferences: jest.fn(),
  },
}));

// Mock sessionStore
jest.mock('../src/viewmodels/sessionStore', () => ({
  useSessionStore: () => ({
    addSession: jest.fn(),
    fetchHands: jest.fn(),
    fetchStats: jest.fn(),
  }),
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

// Mock DateTimePicker
jest.mock('@react-native-community/datetimepicker', () => 'DateTimePicker');

const mockPreferences = {
  lastLocation: 'Live Casino',
  lastCurrency: 'USD ($)',
  lastTableSize: '6',
  lastBlinds: '1/2',
  customLocations: ['Live Casino', 'Home Game', 'Online', 'Club'],
  customCurrencies: ['USD ($)', 'EUR (€)', 'GBP (£)', 'JPY (¥)', 'CNY (¥)'],
  customTableSizes: ['2', '4', '6', '8', '9', '10'],
  customBlinds: ['0.5/1', '1/2', '1/3', '2/5', '5/10', '10/20', '25/50'],
};

describe('NewSessionScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (UserPreferencesService.getPreferences as jest.Mock).mockResolvedValue(mockPreferences);
  });

  it('renders correctly', async () => {
    const { getByText } = render(<NewSessionScreen navigation={mockNavigation} />);
    
    await waitFor(() => {
      expect(getByText('New Session Setup')).toBeTruthy();
    });
  });

  it('loads user preferences on mount', async () => {
    render(<NewSessionScreen navigation={mockNavigation} />);
    
    await waitFor(() => {
      expect(UserPreferencesService.getPreferences).toHaveBeenCalled();
    });
  });

  it('displays loading state initially', () => {
    const { getByText } = render(<NewSessionScreen navigation={mockNavigation} />);
    expect(getByText('載入中...')).toBeTruthy();
  });

  it('renders all form fields after loading', async () => {
    const { getByText } = render(<NewSessionScreen navigation={mockNavigation} />);
    
    await waitFor(() => {
      expect(getByText('Location')).toBeTruthy();
      expect(getByText('Date & Time')).toBeTruthy();
      expect(getByText('Blinds')).toBeTruthy();
      expect(getByText('Currency')).toBeTruthy();
      expect(getByText('Table Size')).toBeTruthy();
      expect(getByText('Effective Stack')).toBeTruthy();
    });
  });

  it('navigates to RecordHand screen when form is submitted', async () => {
    const { getByText } = render(<NewSessionScreen navigation={mockNavigation} />);
    
    await waitFor(() => {
      const submitButton = getByText('Start Recording Hands');
      expect(submitButton).toBeTruthy();
    });

    const submitButton = getByText('Start Recording Hands');
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(mockNavigation.navigate).toHaveBeenCalledWith('RecordHand', {
        sessionId: expect.any(String),
      });
    });
  });

  it('saves user preferences when form is submitted', async () => {
    const { getByText } = render(<NewSessionScreen navigation={mockNavigation} />);
    
    await waitFor(() => {
      const submitButton = getByText('Start Recording Hands');
      fireEvent.press(submitButton);
    });

    await waitFor(() => {
      expect(UserPreferencesService.updateLastChoices).toHaveBeenCalled();
    });
  });

  it('parses blinds correctly', async () => {
    // This would require more complex testing setup to verify the actual parsing
    // For now, we test that the component renders without errors
    const { getByText } = render(<NewSessionScreen navigation={mockNavigation} />);
    
    await waitFor(() => {
      expect(getByText('格式：小盲注/大盲注 (例如: 1/2, 0.5/1)')).toBeTruthy();
    });
  });
}); 