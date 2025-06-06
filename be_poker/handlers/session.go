package handlers

import (
	"encoding/json"
	"net/http"
	"poker_tracker_backend/db"
	"poker_tracker_backend/models"
	"github.com/google/uuid"
)

func CreateSession(w http.ResponseWriter, r *http.Request) {
	var session models.Session
	_ = json.NewDecoder(r.Body).Decode(&session)
	session.ID = uuid.New().String()
	stmt, _ := db.DB.Prepare(`INSERT INTO sessions (id, location, date, small_blind, big_blind, currency, effective_stack, table_size) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
	_, err := stmt.Exec(session.ID, session.Location, session.Date, session.SmallBlind, session.BigBlind, session.Currency, session.EffectiveStack, session.TableSize)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(session)
}

func GetSessions(w http.ResponseWriter, r *http.Request) {
	rows, _ := db.DB.Query(`SELECT id, location, date, small_blind, big_blind, currency, effective_stack, COALESCE(table_size, 6) FROM sessions`)
	sessions := []models.Session{}
	for rows.Next() {
		var s models.Session
		_ = rows.Scan(&s.ID, &s.Location, &s.Date, &s.SmallBlind, &s.BigBlind, &s.Currency, &s.EffectiveStack, &s.TableSize)
		sessions = append(sessions, s)
	}
	json.NewEncoder(w).Encode(sessions)
}

func GetSession(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	row := db.DB.QueryRow(`SELECT id, location, date, small_blind, big_blind, currency, effective_stack, COALESCE(table_size, 6) FROM sessions WHERE id = ?`, id)
	var s models.Session
	err := row.Scan(&s.ID, &s.Location, &s.Date, &s.SmallBlind, &s.BigBlind, &s.Currency, &s.EffectiveStack, &s.TableSize)
	if err != nil {
		http.Error(w, "Session not found", http.StatusNotFound)
		return
	}
	json.NewEncoder(w).Encode(s)
}

func DeleteSession(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	_, err := db.DB.Exec(`DELETE FROM sessions WHERE id = ?`, id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
} 