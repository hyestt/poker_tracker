package handlers

import (
	"encoding/json"
	"net/http"
	"poker_tracker_backend/db"
	"poker_tracker_backend/models"
	"poker_tracker_backend/services"
	"github.com/google/uuid"
	"database/sql"
	"time"
)

func CreateHand(w http.ResponseWriter, r *http.Request) {
	var hand models.Hand
	_ = json.NewDecoder(r.Body).Decode(&hand)
	hand.ID = uuid.New().String()
	stmt, _ := db.DB.Prepare(`INSERT INTO hands (id, session_id, details, result, date, analysis, analysis_date) VALUES (?, ?, ?, ?, ?, ?, ?)`)
	_, err := stmt.Exec(hand.ID, hand.SessionID, hand.Details, hand.Result, hand.Date, hand.Analysis, hand.AnalysisDate)
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
		rows, err = db.DB.Query(`SELECT id, session_id, details, result, date, COALESCE(analysis, '') as analysis, COALESCE(analysis_date, '') as analysis_date FROM hands WHERE session_id = ?`, sessionId)
	} else {
		rows, err = db.DB.Query(`SELECT id, session_id, details, result, date, COALESCE(analysis, '') as analysis, COALESCE(analysis_date, '') as analysis_date FROM hands`)
	}
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	hands := []models.Hand{}
	for rows.Next() {
		var h models.Hand
		_ = rows.Scan(&h.ID, &h.SessionID, &h.Details, &h.Result, &h.Date, &h.Analysis, &h.AnalysisDate)
		hands = append(hands, h)
	}
	json.NewEncoder(w).Encode(hands)
}

func GetHand(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	row := db.DB.QueryRow(`SELECT id, session_id, details, result, date, COALESCE(analysis, '') as analysis, COALESCE(analysis_date, '') as analysis_date FROM hands WHERE id = ?`, id)
	var h models.Hand
	err := row.Scan(&h.ID, &h.SessionID, &h.Details, &h.Result, &h.Date, &h.Analysis, &h.AnalysisDate)
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

func AnalyzeHand(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var request struct {
		HandID string `json:"handId"`
	}
	
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// 獲取手牌詳情
	row := db.DB.QueryRow(`SELECT details, result FROM hands WHERE id = ?`, request.HandID)
	var details string
	var result int
	if err := row.Scan(&details, &result); err != nil {
		http.Error(w, "Hand not found", http.StatusNotFound)
		return
	}

	// 初始化 OpenAI 服務
	openaiService := services.NewOpenAIService()
	if openaiService == nil {
		http.Error(w, "OpenAI service not available. Please set OPENAI_API_KEY environment variable.", http.StatusServiceUnavailable)
		return
	}

	// 分析手牌
	analysis, err := openaiService.AnalyzeHand(details, result)
	if err != nil {
		http.Error(w, "Failed to analyze hand: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// 更新資料庫
	analysisDate := time.Now().Format("2006-01-02 15:04:05")
	_, err = db.DB.Exec(`UPDATE hands SET analysis = ?, analysis_date = ? WHERE id = ?`, 
		analysis, analysisDate, request.HandID)
	if err != nil {
		http.Error(w, "Failed to save analysis", http.StatusInternalServerError)
		return
	}

	// 返回分析結果
	response := map[string]interface{}{
		"handId":      request.HandID,
		"analysis":    analysis,
		"analysisDate": analysisDate,
	}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
} 