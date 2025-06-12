package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"poker_tracker_backend/db"
	"poker_tracker_backend/models"
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
	
	// 設置Content-Type頭
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(session)
}

func GetSessions(w http.ResponseWriter, r *http.Request) {
	rows, err := db.DB.Query(`SELECT id, location, date, small_blind, big_blind, currency, effective_stack, COALESCE(table_size, 6), COALESCE(tag, '') FROM sessions ORDER BY created_at DESC`)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()
	
	sessions := []models.Session{}
	for rows.Next() {
		var s models.Session
		err := rows.Scan(&s.ID, &s.Location, &s.Date, &s.SmallBlind, &s.BigBlind, &s.Currency, &s.EffectiveStack, &s.TableSize, &s.Tag)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		sessions = append(sessions, s)
	}
	json.NewEncoder(w).Encode(sessions)
}

func GetSession(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	row := db.DB.QueryRow(`SELECT id, location, date, small_blind, big_blind, currency, effective_stack, COALESCE(table_size, 6), COALESCE(tag, '') FROM sessions WHERE id = $1`, id)
	var s models.Session
	err := row.Scan(&s.ID, &s.Location, &s.Date, &s.SmallBlind, &s.BigBlind, &s.Currency, &s.EffectiveStack, &s.TableSize, &s.Tag)
	if err != nil {
		http.Error(w, "Session not found", http.StatusNotFound)
		return
	}
	json.NewEncoder(w).Encode(s)
}

func UpdateSession(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	var session models.Session
	if err := json.NewDecoder(r.Body).Decode(&session); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	
	stmt, err := db.DB.Prepare(`UPDATE sessions SET location = $1, date = $2, small_blind = $3, big_blind = $4, currency = $5, effective_stack = $6, table_size = $7, tag = $8 WHERE id = $9`)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer stmt.Close()
	
	_, err = stmt.Exec(session.Location, session.Date, session.SmallBlind, session.BigBlind, session.Currency, session.EffectiveStack, session.TableSize, session.Tag, id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	
	// 返回更新後的session
	row := db.DB.QueryRow(`SELECT id, location, date, small_blind, big_blind, currency, effective_stack, COALESCE(table_size, 6), COALESCE(tag, '') FROM sessions WHERE id = $1`, id)
	var updatedSession models.Session
	err = row.Scan(&updatedSession.ID, &updatedSession.Location, &updatedSession.Date, &updatedSession.SmallBlind, &updatedSession.BigBlind, &updatedSession.Currency, &updatedSession.EffectiveStack, &updatedSession.TableSize, &updatedSession.Tag)
	if err != nil {
		http.Error(w, "Failed to retrieve updated session", http.StatusInternalServerError)
		return
	}
	
	json.NewEncoder(w).Encode(updatedSession)
}

func DeleteSession(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	_, err := db.DB.Exec(`DELETE FROM sessions WHERE id = $1`, id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
} 