-- 這是從Supabase導出的INSERT語句示例
-- 請用實際從Supabase SQL編輯器執行後得到的結果替換這個文件內容

-- Sessions INSERT語句示例
INSERT INTO sessions (id, date, location, buy_in, cash_out, is_completed) VALUES (1, '2025-01-20', 'Local Casino', 100, 150, true) ON CONFLICT (id) DO NOTHING;
INSERT INTO sessions (id, date, location, buy_in, cash_out, is_completed) VALUES (2, '2025-01-22', 'Poker Club', 200, 180, true) ON CONFLICT (id) DO NOTHING;
INSERT INTO sessions (id, date, location, buy_in, cash_out, is_completed) VALUES (3, '2025-01-27', 'Online Poker', 50, 120, true) ON CONFLICT (id) DO NOTHING;

-- Hands INSERT語句示例
INSERT INTO hands (id, session_id, position, hole_cards, action, amount, result, villains, board, note, date, analysis, analysis_date) VALUES (1, 1, 'BTN', 'AsKh', 'Raise', 10, 25, '[]', 'Ah 2d 7c Ks 3h', 'Good value bet on river', '2025-01-20', '這是一個強力起手牌，在按鈕位置加注是標準打法。翻牌配合度高，形成了頂對頂踢腳。', '2025-01-21') ON CONFLICT (id) DO NOTHING;
INSERT INTO hands (id, session_id, position, hole_cards, action, amount, result, villains, board, note, date, analysis, analysis_date) VALUES (2, 1, 'CO', 'JsTs', 'Call', 5, -5, '[{"id":"v1","position":"BTN","cards":"AK"}]', 'Qh Kd 9c 2s 3d', 'Missed straight draw', '2025-01-20', '', '') ON CONFLICT (id) DO NOTHING;
INSERT INTO hands (id, session_id, position, hole_cards, action, amount, result, villains, board, note, date, analysis, analysis_date) VALUES (3, 2, 'SB', 'QcQd', 'Raise', 15, 45, '[{"id":"v2","position":"MP","cards":"JJ"}]', 'Qh 2d 7c As 3h', 'Flopped set', '2025-01-22', '口袋QQ在小盲位置加注是正確的。翻牌命中三條，這是非常強的牌面，應該積極取值。', '2025-01-23') ON CONFLICT (id) DO NOTHING; 