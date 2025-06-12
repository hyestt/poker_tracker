-- Railway PostgreSQL 初始化腳本
-- 建立Poker Tracker所需的表格

-- Sessions 表格
CREATE TABLE IF NOT EXISTS sessions (
    id SERIAL PRIMARY KEY,
    date TEXT NOT NULL,
    location TEXT NOT NULL,
    buy_in INTEGER NOT NULL,
    cash_out INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Hands 表格
CREATE TABLE IF NOT EXISTS hands (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL,
    position TEXT NOT NULL,
    hole_cards TEXT NOT NULL,
    action TEXT NOT NULL,
    amount INTEGER NOT NULL,
    result INTEGER NOT NULL,
    villains TEXT DEFAULT '[]',
    board TEXT DEFAULT '',
    note TEXT DEFAULT '',
    date TEXT NOT NULL,
    analysis TEXT DEFAULT '',
    analysis_date TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

-- 建立索引以提升效能
CREATE INDEX IF NOT EXISTS idx_hands_session_id ON hands(session_id);
CREATE INDEX IF NOT EXISTS idx_hands_date ON hands(date);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(date);

-- 插入測試資料（可選）
INSERT INTO sessions (date, location, buy_in, cash_out, is_completed) 
VALUES ('2025-01-27', 'Test Casino', 100, 150, true)
ON CONFLICT DO NOTHING;

-- 顯示建立完成訊息
SELECT 'Railway PostgreSQL tables created successfully!' as status; 