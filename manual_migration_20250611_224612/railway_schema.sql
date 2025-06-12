-- Railway PostgreSQL Schema for Poker Tracker
-- 清理版本，移除 Supabase 特定功能

-- 創建 sessions 表
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    location TEXT,
    date TEXT,
    small_blind INTEGER,
    big_blind INTEGER,
    currency TEXT,
    effective_stack INTEGER,
    table_size INTEGER DEFAULT 6,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 創建 hands 表
CREATE TABLE IF NOT EXISTS hands (
    id TEXT PRIMARY KEY,
    session_id TEXT,
    position TEXT,
    hole_cards TEXT,
    details TEXT,
    result_amount INTEGER DEFAULT 0,
    analysis TEXT,
    analysis_date TIMESTAMP WITH TIME ZONE,
    is_favorite BOOLEAN DEFAULT FALSE,
    tag TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    board TEXT,
    note TEXT,
    villains TEXT,
    date TEXT,
    FOREIGN KEY (session_id) REFERENCES sessions(id)
);

-- 創建索引
CREATE INDEX IF NOT EXISTS idx_hands_session_id ON hands(session_id);
CREATE INDEX IF NOT EXISTS idx_hands_created_at ON hands(created_at);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_hands_is_favorite ON hands(is_favorite);
