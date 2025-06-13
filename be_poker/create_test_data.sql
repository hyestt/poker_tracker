-- 創建測試 session
INSERT OR REPLACE INTO sessions (id, location, date, small_blind, big_blind, currency, effective_stack, table_size, tag) 
VALUES ('test_session_2025', 'Test Casino', '2025-01-27 20:00', 1, 2, 'USD', 200, 6, 'test');

-- 創建測試手牌
-- 手牌 1: 大牌獲勝 (AA vs KK)
INSERT OR REPLACE INTO hands (id, session_id, details, result, date, analysis, analysis_date, hole_cards, position, board, note, tag, villains, favorite) 
VALUES (
  'test_hand_1', 
  'test_session_2025', 
  'AA vs KK preflop all-in, flopped set of aces', 
  180, 
  '2025-01-27T20:15:00.000Z', 
  'Excellent preflop play with pocket aces. Going all-in against KK was the correct decision to maximize value.',
  '2025-01-27 20:16:00',
  'A♠ A♥',
  'BTN',
  'A♦ 7♣ 2♠',
  'Flopped top set, easy call',
  'premium',
  '[{"id":"villain_1","holeCards":"K♠ K♥","position":"BB"}]',
  1
);

-- 手牌 2: 詐唬成功
INSERT OR REPLACE INTO hands (id, session_id, details, result, date, analysis, analysis_date, hole_cards, position, board, note, tag, villains, favorite) 
VALUES (
  'test_hand_2', 
  'test_session_2025', 
  'Successful bluff on river with air, opponent folded top pair', 
  45, 
  '2025-01-27T20:25:00.000Z', 
  'Well-timed bluff on a scary river card. Good read on opponent weakness.',
  '2025-01-27 20:26:00',
  '7♠ 6♠',
  'CO',
  'A♠ K♦ 9♣ 5♠ 2♠',
  'Bluffed with flush draw that missed',
  'bluff',
  '[{"id":"villain_2","holeCards":"A♥ Q♦","position":"BB"}]',
  0
);

-- 手牌 3: 慘敗 (set over set)
INSERT OR REPLACE INTO hands (id, session_id, details, result, date, analysis, analysis_date, hole_cards, position, board, note, tag, villains, favorite) 
VALUES (
  'test_hand_3', 
  'test_session_2025', 
  'Set over set cooler, lost full stack with bottom set', 
  -195, 
  '2025-01-27T20:35:00.000Z', 
  'Unavoidable cooler situation. Bottom set vs top set is nearly impossible to fold.',
  '2025-01-27 20:36:00',
  '3♠ 3♥',
  'UTG',
  '3♦ 9♠ 9♥',
  'Cooler hand, nothing I could do',
  'cooler',
  '[{"id":"villain_3","holeCards":"9♣ 9♦","position":"HJ"}]',
  0
);

-- 手牌 4: 小勝利 (value bet)
INSERT OR REPLACE INTO hands (id, session_id, details, result, date, analysis, analysis_date, hole_cards, position, board, note, tag, villains, favorite) 
VALUES (
  'test_hand_4', 
  'test_session_2025', 
  'Top pair good kicker, value bet on river got called by worse', 
  28, 
  '2025-01-27T20:45:00.000Z', 
  'Good value betting line. Extracted maximum value from second pair.',
  '2025-01-27 20:46:00',
  'A♦ K♠',
  'BB',
  'A♣ 7♦ 2♠ 5♥ J♠',
  'Standard value bet line',
  'value',
  '[{"id":"villain_4","holeCards":"A♥ 8♦","position":"BTN"}]',
  0
);

-- 手牌 5: 詐唬失敗
INSERT OR REPLACE INTO hands (id, session_id, details, result, date, analysis, analysis_date, hole_cards, position, board, note, tag, villains, favorite) 
VALUES (
  'test_hand_5', 
  'test_session_2025', 
  'Failed bluff attempt, opponent called with middle pair', 
  -65, 
  '2025-01-27T20:55:00.000Z', 
  'Bluff attempt was too ambitious. Opponent showed good call with middle pair.',
  '2025-01-27 20:56:00',
  'Q♠ J♦',
  'SB',
  'K♦ 8♣ 3♠ 2♥ 7♠',
  'Should have given up on turn',
  'bluff',
  '[{"id":"villain_5","holeCards":"8♠ 8♥","position":"CO"}]',
  0
);

-- 手牌 6: 經典翻牌圈 all-in
INSERT OR REPLACE INTO hands (id, session_id, details, result, date, analysis, analysis_date, hole_cards, position, board, note, tag, villains, favorite) 
VALUES (
  'test_hand_6', 
  'test_session_2025', 
  'Flush draw vs overpair, hit flush on river', 
  120, 
  '2025-01-27T21:05:00.000Z', 
  'Semi-bluff all-in with flush draw was correct. Got lucky to hit on river.',
  '2025-01-27 21:06:00',
  'Q♠ J♠',
  'HJ',
  'T♠ 9♠ 2♦ 4♣ 8♠',
  'Hit the flush on river!',
  'draw',
  '[{"id":"villain_6","holeCards":"K♦ K♣","position":"BTN"}]',
  1
); 