-- Railway 資料庫遷移腳本
-- 修復sessions和hands表格結構，匹配Supabase

-- 檢查並修復sessions表格
DO $$
BEGIN
    -- 檢查sessions表格是否存在且結構正確
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sessions') THEN
        -- 如果表格存在但結構不正確，重建它
        DROP TABLE IF EXISTS hands CASCADE;
        DROP TABLE IF EXISTS sessions CASCADE;
    END IF;
END $$;

-- 重新建立sessions表格（正確結構）
CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    location TEXT DEFAULT '',
    date TEXT DEFAULT '',
    small_blind INTEGER DEFAULT 0,
    big_blind INTEGER DEFAULT 0,
    currency TEXT DEFAULT '',
    effective_stack INTEGER DEFAULT 0,
    table_size INTEGER DEFAULT 6,
    tag TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 重新建立hands表格（正確結構）
CREATE TABLE hands (
    id TEXT PRIMARY KEY,
    session_id TEXT DEFAULT '',
    position TEXT DEFAULT '',
    hole_cards TEXT DEFAULT '',
    board TEXT DEFAULT '',
    details TEXT DEFAULT '',
    note TEXT DEFAULT '',
    result_amount INTEGER DEFAULT 0,
    date TEXT DEFAULT '',
    villains TEXT DEFAULT '[]',
    analysis TEXT DEFAULT '',
    analysis_date TEXT DEFAULT '',
    is_favorite BOOLEAN DEFAULT FALSE,
    tag TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

-- 建立索引
CREATE INDEX idx_hands_session_id ON hands(session_id);
CREATE INDEX idx_hands_date ON hands(date);
CREATE INDEX idx_sessions_date ON sessions(date);
CREATE INDEX idx_hands_result_amount ON hands(result_amount);

-- 確認遷移完成
SELECT 'Database migration completed successfully!' as status; 