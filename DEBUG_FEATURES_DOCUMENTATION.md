# Debug & Testing Features Documentation

## Overview
This document records the debug and testing features that were hidden from production builds but remain available in development mode.

## Location
File: `fe_poker/src/screens/SettingsScreen.tsx`
Lines: 291-325 (Debug & Testing section)

## Features Available in Development Mode

### 1. Toggle Premium Status (Test Mode)
- **Function**: `handleToggleTestPremium()`
- **Purpose**: Allows developers to test premium features without actual purchase
- **Implementation**: Uses `RevenueCat.setTestPremiumStatus()` to simulate premium status
- **UI**: Shows current status as "Premium" or "Free" with color coding
- **Location**: Lines 128-144

### 2. Create 9 Test Hands
- **Function**: `handleCreateTestHands()`
- **Purpose**: Creates test data to verify the 10-hand limit for free users
- **Implementation**: Uses `createTestHands()` utility function
- **UI**: Warns user about creating 9 test hands to test the limit
- **Location**: Lines 146-174

### 3. Create Welcome Demo Session
- **Function**: `handleCreateWelcomeDemo()`
- **Purpose**: Creates demo session data for user onboarding/testing
- **Implementation**: Uses `WelcomeDemoService.createWelcomeData()`
- **Features**:
  - Checks if demo data already exists
  - Offers to recreate if data exists
  - Refreshes all data stores after creation
- **Location**: Lines 192-244

### 4. Debug Status Display
- **Purpose**: Shows current premium status in a debug info box
- **Implementation**: Simple text display showing "Premium" or "Free"
- **Styling**: Uses special debug styling with input background
- **Location**: Lines 319-324

## Technical Implementation

### Conditional Rendering
All debug features are wrapped in a `__DEV__` check:
```typescript
{__DEV__ && (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Debug & Testing</Text>
    // ... debug features
  </View>
)}
```

### Related Services
1. **RevenueCatService**: Handles test premium status
2. **createTestHands**: Utility for creating test data
3. **WelcomeDemoService**: Creates demo session data

### Styling
- `testModeActive`: Green color for premium status
- `testModeInactive`: Red color for free status  
- `debugInfo`: Special container styling
- `debugText`: Centered text styling

## Why These Features Exist

### Testing Premium Features
- Allows QA to test premium functionality without purchases
- Enables development of premium-only features
- Verifies paywall behavior and limitations

### Data Testing
- Tests hand limit functionality for free users
- Provides consistent demo data for onboarding
- Enables testing with realistic poker session data

### User Experience Testing
- Welcome demo helps test user onboarding flow
- Consistent test data for UI/UX validation
- Simulates real user scenarios

## Security Notes
- All features are development-only (`__DEV__` flag)
- No production impact on actual RevenueCat purchases
- Test status is local to the device only
- No API calls to production servers for test features

## Maintenance
- Keep this documentation updated when debug features change
- Review debug features periodically for continued relevance
- Ensure all debug code remains in `__DEV__` blocks only

## Restoration Instructions
If you need to restore these features to production temporarily:
1. Remove the `__DEV__ &&` condition from line 292
2. Rebuild the app
3. **Remember to restore the condition before production release**

---
*Last updated: January 2025*
*Features hidden from production build while maintaining development functionality*