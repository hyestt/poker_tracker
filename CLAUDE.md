# CLAUDE.md - AI Assistant Context

## Project Overview
This is a Poker Tracker React Native application for tracking poker hands and sessions.

## Key Commands

### Build and Run
```bash
# iOS
cd fe_poker && npm run ios -- --simulator="iPhone 16"

# Android
cd fe_poker && npm run android

# Start Metro bundler
cd fe_poker && npm start
```

### Linting and Type Checking
```bash
cd fe_poker && npm run lint
cd fe_poker && npm run typecheck  # If available
```

### Clean Build (iOS Issues)
```bash
cd fe_poker
rm -rf ~/Library/Developer/Xcode/DerivedData/PokerTrackerApp-*
rm -rf ios/build/
npx react-native clean --include "metro,watchman,cocoapods"
rm -rf node_modules && npm install
cd ios && rm -rf Pods Podfile.lock && pod install
```

## Project Structure
- `/fe_poker` - React Native frontend application
- `/fe_poker/src` - Source code
  - `/services/DatabaseService.ts` - SQLite database management
  - `/screens` - App screens
  - `/components` - Reusable components
  - `/viewmodels` - View models and state management

## Current Architecture
- React Native 0.80.0
- TypeScript
- SQLite for local storage (react-native-sqlite-storage)
- React Navigation for routing
- Zustand for state management

## Known Issues
1. **Legacy Architecture Warning**: The app shows a deprecation warning about Legacy Architecture. This can be fixed by enabling New Architecture in Podfile (`fabric_enabled => true`), but may cause build issues.

2. **Database Isolation**: Each iOS simulator has its own database. Data doesn't sync between different simulator devices.

## Testing Strategy
- Primary development on iPhone 16 or iPhone 15 Pro
- Test different screen sizes before release (SE, Standard, Pro Max)
- No need to test every device for routine development

## Troubleshooting
See `/docs/iOS_Build_Troubleshooting.md` for detailed iOS build issue solutions.