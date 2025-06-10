package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"
	"poker_tracker_backend/db"
	"poker_tracker_backend/models"
	"poker_tracker_backend/services"
	"github.com/google/uuid"
)

func CreateHand(w http.ResponseWriter, r *http.Request) {
	var hand models.Hand
	if err := json.NewDecoder(r.Body).Decode(&hand); err != nil {
		http.Error(w, "Invalid JSON: "+err.Error(), http.StatusBadRequest)
		return
	}
	
	// 調試信息
	holeCardsStr := ""
	positionStr := ""
	if hand.HoleCards != nil {
		holeCardsStr = *hand.HoleCards
	}
	if hand.Position != nil {
		positionStr = *hand.Position
	}
	fmt.Printf("DEBUG CreateHand: HoleCards='%s', Position='%s'\n", holeCardsStr, positionStr)
	
	// 只有當前端沒有提供ID時才生成新的UUID
	if hand.ID == "" {
		hand.ID = uuid.New().String()
	}
	
	// 將 villains 序列化為 JSON
	villainsJSON, err := json.Marshal(hand.Villains)
	if err != nil {
		http.Error(w, "Failed to serialize villains: "+err.Error(), http.StatusInternalServerError)
		return
	}
	
	stmt, err := db.DB.Prepare(`INSERT INTO hands (id, session_id, hole_cards, board, position, details, note, result, date, villains, analysis, analysis_date, favorite) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
	if err != nil {
		http.Error(w, "Database prepare error: "+err.Error(), http.StatusInternalServerError)
		return
	}
	_, err = stmt.Exec(hand.ID, hand.SessionID, hand.HoleCards, hand.Board, hand.Position, hand.Details, hand.Note, hand.Result, hand.Date, string(villainsJSON), hand.Analysis, hand.AnalysisDate, hand.Favorite)
	if err != nil {
		http.Error(w, "Database insert error: "+err.Error(), http.StatusInternalServerError)
		return
	}
	
	// 返回完整的hand對象，包括新添加的欄位
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(hand)
}

func GetHands(w http.ResponseWriter, r *http.Request) {
	rows, err := db.DB.Query(`SELECT id, session_id, COALESCE(hole_cards, '') as hole_cards, COALESCE(board, '') as board, COALESCE(position, '') as position, details, COALESCE(note, '') as note, result, date, COALESCE(villains, '[]') as villains, COALESCE(analysis, '') as analysis, COALESCE(analysis_date, '') as analysis_date, COALESCE(favorite, 0) as favorite FROM hands`)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()
	
	hands := []models.Hand{}
	for rows.Next() {
		var h models.Hand
		var villainsJSON string
		err := rows.Scan(&h.ID, &h.SessionID, &h.HoleCards, &h.Board, &h.Position, &h.Details, &h.Note, &h.Result, &h.Date, &villainsJSON, &h.Analysis, &h.AnalysisDate, &h.Favorite)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		
		// 反序列化 villains JSON
		if villainsJSON != "" && villainsJSON != "[]" {
			if err := json.Unmarshal([]byte(villainsJSON), &h.Villains); err != nil {
				h.Villains = []models.Villain{} // 如果解析失敗，設為空陣列
			}
		} else {
			h.Villains = []models.Villain{}
		}
		
		hands = append(hands, h)
	}
	json.NewEncoder(w).Encode(hands)
}

func GetHand(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	row := db.DB.QueryRow(`SELECT id, session_id, COALESCE(hole_cards, '') as hole_cards, COALESCE(board, '') as board, COALESCE(position, '') as position, details, COALESCE(note, '') as note, result, date, COALESCE(villains, '[]') as villains, COALESCE(analysis, '') as analysis, COALESCE(analysis_date, '') as analysis_date, COALESCE(favorite, 0) as favorite FROM hands WHERE id = ?`, id)
	var h models.Hand
	var villainsJSON string
	err := row.Scan(&h.ID, &h.SessionID, &h.HoleCards, &h.Board, &h.Position, &h.Details, &h.Note, &h.Result, &h.Date, &villainsJSON, &h.Analysis, &h.AnalysisDate, &h.Favorite)
	if err != nil {
		http.Error(w, "Hand not found", http.StatusNotFound)
		return
	}
	
	// 反序列化 villains JSON
	if villainsJSON != "" && villainsJSON != "[]" {
		if err := json.Unmarshal([]byte(villainsJSON), &h.Villains); err != nil {
			h.Villains = []models.Villain{} // 如果解析失敗，設為空陣列
		}
	} else {
		h.Villains = []models.Villain{}
	}
	
	json.NewEncoder(w).Encode(h)
}

func UpdateHand(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	var hand models.Hand
	if err := json.NewDecoder(r.Body).Decode(&hand); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	
	// 將 villains 序列化為 JSON
	villainsJSON, err := json.Marshal(hand.Villains)
	if err != nil {
		http.Error(w, "Failed to serialize villains: "+err.Error(), http.StatusInternalServerError)
		return
	}
	
	stmt, err := db.DB.Prepare(`UPDATE hands SET hole_cards = ?, board = ?, position = ?, details = ?, note = ?, result = ?, date = ?, villains = ?, favorite = ? WHERE id = ?`)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	
	_, err = stmt.Exec(hand.HoleCards, hand.Board, hand.Position, hand.Details, hand.Note, hand.Result, hand.Date, string(villainsJSON), hand.Favorite, id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	
	// 返回更新後的手牌
	row := db.DB.QueryRow(`SELECT id, session_id, COALESCE(hole_cards, '') as hole_cards, COALESCE(board, '') as board, COALESCE(position, '') as position, details, COALESCE(note, '') as note, result, date, COALESCE(villains, '[]') as villains, COALESCE(analysis, '') as analysis, COALESCE(analysis_date, '') as analysis_date, COALESCE(favorite, 0) as favorite FROM hands WHERE id = ?`, id)
	var updatedHand models.Hand
	var updatedVillainsJSON string
	err = row.Scan(&updatedHand.ID, &updatedHand.SessionID, &updatedHand.HoleCards, &updatedHand.Board, &updatedHand.Position, &updatedHand.Details, &updatedHand.Note, &updatedHand.Result, &updatedHand.Date, &updatedVillainsJSON, &updatedHand.Analysis, &updatedHand.AnalysisDate, &updatedHand.Favorite)
	if err != nil {
		http.Error(w, "Failed to retrieve updated hand", http.StatusInternalServerError)
		return
	}
	
	// 反序列化 villains JSON
	if updatedVillainsJSON != "" && updatedVillainsJSON != "[]" {
		if err := json.Unmarshal([]byte(updatedVillainsJSON), &updatedHand.Villains); err != nil {
			updatedHand.Villains = []models.Villain{} // 如果解析失敗，設為空陣列
		}
	} else {
		updatedHand.Villains = []models.Villain{}
	}
	
	json.NewEncoder(w).Encode(updatedHand)
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

func ToggleFavorite(w http.ResponseWriter, r *http.Request) {
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

	// 獲取當前最愛狀態
	row := db.DB.QueryRow(`SELECT COALESCE(favorite, 0) FROM hands WHERE id = ?`, request.HandID)
	var currentFavorite bool
	if err := row.Scan(&currentFavorite); err != nil {
		http.Error(w, "Hand not found", http.StatusNotFound)
		return
	}

	// 切換最愛狀態
	newFavorite := !currentFavorite
	_, err := db.DB.Exec(`UPDATE hands SET favorite = ? WHERE id = ?`, newFavorite, request.HandID)
	if err != nil {
		http.Error(w, "Failed to update favorite status", http.StatusInternalServerError)
		return
	}

	// 返回新的狀態
	response := map[string]interface{}{
		"handId":   request.HandID,
		"favorite": newFavorite,
	}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
} 