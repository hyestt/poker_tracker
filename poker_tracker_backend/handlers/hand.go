package handlers

import (
	"encoding/json"
	"net/http"
	"poker_tracker_backend/db"
	"poker_tracker_backend/models"
	"github.com/google/uuid"
)

func CreateHand(w http.ResponseWriter, r *http.Request) {
	var hand models.Hand
	_ = json.NewDecoder(r.Body).Decode(&hand)
	hand.ID = uuid.New().String()
	stmt, _ := db.DB.Prepare(`INSERT INTO hands (id, session_id, details, result, date) VALUES (?, ?, ?, ?, ?)`)
	_, err := stmt.Exec(hand.ID, hand.SessionID, hand.Details, hand.Result, hand.Date)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(hand)
}

func GetHands(w http.ResponseWriter, r *http.Request) {
	sessionId := r.URL.Query().Get("session_id")
	var rows *sql.Rows
	var err error
	if sessionId != "" {
		rows, err = db.DB.Query(`SELECT id, session_id, details, result, date FROM hands WHERE session_id = ?`, sessionId)
	} else {
		rows, err = db.DB.Query(`SELECT id, session_id, details, result, date FROM hands`)
	}
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	hands := []models.Hand{}
	for rows.Next() {
		var h models.Hand
		_ = rows.Scan(&h.ID, &h.SessionID, &h.Details, &h.Result, &h.Date)
		hands = append(hands, h)
	}
	json.NewEncoder(w).Encode(hands)
}

func GetHand(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	row := db.DB.QueryRow(`SELECT id, session_id, details, result, date FROM hands WHERE id = ?`, id)
	var h models.Hand
	err := row.Scan(&h.ID, &h.SessionID, &h.Details, &h.Result, &h.Date)
	if err != nil {
		http.Error(w, "Hand not found", http.StatusNotFound)
		return
	}
	json.NewEncoder(w).Encode(h)
}

func DeleteHand(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	_, err := db.DB.Exec(`DELETE FROM hands WHERE id = ?`, id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
} 