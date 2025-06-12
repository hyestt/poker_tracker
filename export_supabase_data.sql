-- 從Supabase導出數據的SQL腳本
-- 請在Supabase SQL編輯器中執行這個腳本，然後將結果複製下來

-- 導出Sessions表數據為INSERT語句
SELECT 
  'INSERT INTO sessions (id, location, date, small_blind, big_blind, currency, effective_stack, table_size) VALUES (' || 
  quote_literal(id) || ', ' || 
  COALESCE(quote_literal(location), 'NULL') || ', ' || 
  COALESCE(quote_literal(date), 'NULL') || ', ' || 
  COALESCE(small_blind::text, 'NULL') || ', ' || 
  COALESCE(big_blind::text, 'NULL') || ', ' || 
  COALESCE(quote_literal(currency), 'NULL') || ', ' || 
  COALESCE(effective_stack::text, 'NULL') || ', ' || 
  COALESCE(table_size::text, '6') || 
  ') ON CONFLICT (id) DO NOTHING;' as insert_statement
FROM 
  sessions
ORDER BY 
  id;

-- 導出Hands表數據為INSERT語句
SELECT 
  'INSERT INTO hands (id, session_id, position, hole_cards, details, result_amount, analysis, analysis_date, is_favorite, tag, board, note, villains, date) VALUES (' || 
  quote_literal(id) || ', ' || 
  COALESCE(quote_literal(session_id), 'NULL') || ', ' || 
  COALESCE(quote_literal(position), 'NULL') || ', ' || 
  COALESCE(quote_literal(hole_cards), 'NULL') || ', ' || 
  COALESCE(quote_literal(details), 'NULL') || ', ' || 
  COALESCE(result_amount::text, '0') || ', ' || 
  COALESCE(quote_literal(analysis), 'NULL') || ', ' || 
  COALESCE('''' || analysis_date || '''', 'NULL') || ', ' || 
  COALESCE(CASE WHEN is_favorite THEN 'true' ELSE 'false' END, 'false') || ', ' || 
  COALESCE(quote_literal(tag), 'NULL') || ', ' || 
  COALESCE(quote_literal(board), 'NULL') || ', ' || 
  COALESCE(quote_literal(note), 'NULL') || ', ' || 
  COALESCE(quote_literal(villains), 'NULL') || ', ' || 
  COALESCE(quote_literal(date), 'NULL') || 
  ') ON CONFLICT (id) DO NOTHING;' as insert_statement
FROM 
  hands
ORDER BY 
  id; 