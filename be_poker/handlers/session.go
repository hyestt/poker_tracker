package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"poker_tracker/db"
	"poker_tracker/models"
	"github.com/google/uuid"
)

func CreateSession(w http.ResponseWriter, r *http.Request) {
	var session models.Session
	if err := json.NewDecoder(r.Body).Decode(&session); err != nil {
		http.Error(w, "Invalid JSON: "+err.Error(), http.StatusBadRequest)
		return
	}
	
	// 調試信息
	fmt.Printf("DEBUG CreateSession: Received session data: %+v\n", session)
	fmt.Printf("DEBUG CreateSession: Tag value: '%s'\n", session.Tag)
	
	// 只有當前端沒有提供ID時才生成新的UUID
	if session.ID == "" {
		session.ID = uuid.New().String()
	}
	
	stmt, err := db.DB.Prepare(`INSERT INTO sessions (id, location, date, small_blind, big_blind, currency, effective_stack, table_size, tag) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`)
	if err != nil {
		http.Error(w, "Database prepare error: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer stmt.Close()
	
	fmt.Printf("DEBUG CreateSession: Executing INSERT with tag: '%s'\n", session.Tag)
	_, err = stmt.Exec(session.ID, session.Location, session.Date, session.SmallBlind, session.BigBlind, session.Currency, session.EffectiveStack, session.TableSize, session.Tag)
	if err != nil {
		http.Error(w, "Database insert error: "+err.Error(), http.StatusInternalServerError)
		return
	}
	
	// 設置Content-Type頭和CORS
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(session)
}

func GetSessions(w http.ResponseWriter, r *http.Request) {
	// 移除ORDER BY created_at，因為Railway資料庫可能沒有這個欄位
	// 改用date欄位排序
	rows, err := db.DB.Query(`
		SELECT 
			id, 
			COALESCE(location, ''), 
			COALESCE(date, ''), 
			COALESCE(small_blind, 0), 
			COALESCE(big_blind, 0), 
			COALESCE(currency, ''), 
			COALESCE(effective_stack, 0), 
			COALESCE(table_size, 6), 
			COALESCE(tag, '') 
		FROM sessions 
		ORDER BY date DESC
	`)
	if err != nil {
		http.Error(w, "Database query error: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()
	
	sessions := []models.Session{}
	for rows.Next() {
		var s models.Session
		err := rows.Scan(&s.ID, &s.Location, &s.Date, &s.SmallBlind, &s.BigBlind, &s.Currency, &s.EffectiveStack, &s.TableSize, &s.Tag)
		if err != nil {
			// 記錄錯誤但繼續處理其他行
			fmt.Printf("Error scanning session row: %v\n", err)
			continue
		}
		sessions = append(sessions, s)
	}
	
	// 設置CORS和Content-Type頭
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(sessions)
}

func GetSession(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	if id == "" {
		http.Error(w, "Missing id parameter", http.StatusBadRequest)
		return
	}
	
	row := db.DB.QueryRow(`
		SELECT 
			id, 
			COALESCE(location, ''), 
			COALESCE(date, ''), 
			COALESCE(small_blind, 0), 
			COALESCE(big_blind, 0), 
			COALESCE(currency, ''), 
			COALESCE(effective_stack, 0), 
			COALESCE(table_size, 6), 
			COALESCE(tag, '') 
		FROM sessions 
		WHERE id = $1
	`, id)
	
	var s models.Session
	err := row.Scan(&s.ID, &s.Location, &s.Date, &s.SmallBlind, &s.BigBlind, &s.Currency, &s.EffectiveStack, &s.TableSize, &s.Tag)
	if err != nil {
		http.Error(w, "Session not found: "+err.Error(), http.StatusNotFound)
		return
	}
	
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(s)
}

func UpdateSession(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	if id == "" {
		http.Error(w, "Missing id parameter", http.StatusBadRequest)
		return
	}
	
	var session models.Session
	if err := json.NewDecoder(r.Body).Decode(&session); err != nil {
		http.Error(w, "Invalid request body: "+err.Error(), http.StatusBadRequest)
		return
	}
	
	stmt, err := db.DB.Prepare(`UPDATE sessions SET location = $1, date = $2, small_blind = $3, big_blind = $4, currency = $5, effective_stack = $6, table_size = $7, tag = $8 WHERE id = $9`)
	if err != nil {
		http.Error(w, "Database prepare error: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer stmt.Close()
	
	_, err = stmt.Exec(session.Location, session.Date, session.SmallBlind, session.BigBlind, session.Currency, session.EffectiveStack, session.TableSize, session.Tag, id)
	if err != nil {
		http.Error(w, "Database update error: "+err.Error(), http.StatusInternalServerError)
		return
	}
	
	// 返回更新後的session
	row := db.DB.QueryRow(`
		SELECT 
			id, 
			COALESCE(location, ''), 
			COALESCE(date, ''), 
			COALESCE(small_blind, 0), 
			COALESCE(big_blind, 0), 
			COALESCE(currency, ''), 
			COALESCE(effective_stack, 0), 
			COALESCE(table_size, 6), 
			COALESCE(tag, '') 
		FROM sessions 
		WHERE id = $1
	`, id)
	
	var updatedSession models.Session
	err = row.Scan(&updatedSession.ID, &updatedSession.Location, &updatedSession.Date, &updatedSession.SmallBlind, &updatedSession.BigBlind, &updatedSession.Currency, &updatedSession.EffectiveStack, &updatedSession.TableSize, &updatedSession.Tag)
	if err != nil {
		http.Error(w, "Failed to retrieve updated session: "+err.Error(), http.StatusInternalServerError)
		return
	}
	
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(updatedSession)
}

func DeleteSession(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	if id == "" {
		http.Error(w, "Missing id parameter", http.StatusBadRequest)
		return
	}
	
	_, err := db.DB.Exec(`DELETE FROM sessions WHERE id = $1`, id)
	if err != nil {
		http.Error(w, "Database delete error: "+err.Error(), http.StatusInternalServerError)
		return
	}
	
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.WriteHeader(http.StatusNoContent)
} 