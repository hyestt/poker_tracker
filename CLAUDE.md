# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Frontend (React Native)
```bash
# Install dependencies
cd fe_poker && npm install

# Start Metro bundler
npm start

# Run on platforms
npm run android
npm run ios  # Requires: bundle install && bundle exec pod install

# Development
npm run lint
npm test
```

### Backend (Go)
```bash
# Start server
cd be_poker && go run main.go

# Build binary
go build -o poker_tracker_backend

# Environment setup
export OPENAI_API_KEY="your-api-key"  # Required for AI analysis features
```

### Root Commands (delegates to fe_poker)
```bash
npm run ios
npm run android
npm start
npm run lint
npm test
```

## Architecture Overview

### Frontend Architecture (MVVM Pattern)
- **Models**: `fe_poker/src/models.ts` - Data structures (Session, Hand, Stats, Villain)
- **ViewModels**: `fe_poker/src/viewmodels/sessionStore.ts` - Zustand store managing all state and business logic
- **Views**: `fe_poker/src/screens/` - Screen components (Home, NewSession, RecordHand, History, etc.)
- **Components**: `fe_poker/src/components/` - Reusable UI components
- **Services**: Database abstraction, API calls, RevenueCat integration

### Backend Architecture (Go RESTful API)
- **Entry**: `be_poker/main.go` - Server startup, environment checking, port management
- **Routes**: `be_poker/routes/` - API route definitions
- **Handlers**: `be_poker/handlers/` - Request processing logic (sessions, hands, stats)
- **Models**: `be_poker/models/` - Go data structures
- **Services**: OpenAI integration for hand analysis, prompt management
- **Database**: `be_poker/db/` - SQLite database abstraction

### Core Features
1. **Session Management**: Create/edit poker sessions with location, blinds, stakes
2. **Hand Recording**: Track individual hands with hole cards, board, results
3. **AI Analysis**: OpenAI-powered hand analysis with strategic insights
4. **Statistics**: Comprehensive P&L tracking, win rates, venue analysis
5. **Dual Mode**: Local SQLite storage + optional API backend sync

### Technology Stack
- **Frontend**: React Native 0.80, React 19.1.0, TypeScript, Zustand (state), React Navigation
- **Backend**: Go 1.21, SQLite, OpenAI API (go-openai v1.32.5)
- **Mobile**: iOS/Android with native dependencies (date picker, purchases, gesture handling)
- **Testing**: Jest, React Native Testing Library

## Key Implementation Details

### State Management
- Single Zustand store (`sessionStore.ts`) manages all application state
- Supports both local SQLite mode and API backend mode
- Automatic fallback to local mode if backend unavailable

### Data Flow
- ViewModels call DatabaseService or API endpoints
- UI components subscribe to store state changes
- Navigation handled via React Navigation stack/tabs

### Mobile-Specific Features
- RevenueCat integration for premium subscriptions
- Native date picker for session timestamps  
- Gesture handling for card selection interfaces
- SQLite storage for offline functionality

### AI Analysis Integration
- Backend requires `OPENAI_API_KEY` environment variable
- Uses GPT-4o-mini for cost-effective hand analysis
- Analysis stored in database and cached in frontend

## Development Notes

### Environment Setup
- Backend checks for OpenAI API key on startup
- Server automatically attempts to kill existing processes on port 8080
- Frontend supports hot reloading via Metro bundler

### Database Structure
- SQLite database with sessions, hands, and analysis tables
- UUIDs for all entity identifiers
- Supports both local and remote database modes

### iOS Setup Requirements
For iOS development, run these commands in `fe_poker/` directory:
```bash
bundle install
bundle exec pod install
```