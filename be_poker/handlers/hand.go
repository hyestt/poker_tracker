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
	err := json.NewDecoder(r.Body).Decode(&hand)
	if err != nil {
		http.Error(w, "Invalid JSON: "+err.Error(), http.StatusBadRequest)
		return
	}
	
	hand.ID = uuid.New().String()
	
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
	
	// 使用新的資料庫結構欄位
	stmt, err := db.DB.Prepare(`
		INSERT INTO hands (
			id, session_id, position, hole_cards, details, result_amount, 
			analysis, analysis_date, is_favorite, tag, board, note, villains, date
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
	`)
	if err != nil {
		http.Error(w, "Database error: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer stmt.Close()
	
	// 處理villains JSON
	villainsJSON := "[]"
	if hand.Villains != nil && len(hand.Villains) > 0 {
		villainsBytes, err := json.Marshal(hand.Villains)
		if err == nil {
			villainsJSON = string(villainsBytes)
		}
	}
	
	_, err = stmt.Exec(
		hand.ID, 
		hand.SessionID, 
		hand.Position, 
		hand.HoleCards, 
		hand.Details, 
		hand.Result, 
		hand.Analysis, 
		hand.AnalysisDate, 
		hand.Favorite, 
		"", // tag
		hand.Board, 
		hand.Note, 
		villainsJSON, 
		hand.Date,
	)
	
	if err != nil {
		http.Error(w, "Insert error: "+err.Error(), http.StatusInternalServerError)
		return
	}
	
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(hand)
}

func GetHands(w http.ResponseWriter, r *http.Request) {
	rows, err := db.DB.Query(`
		SELECT 
			id, 
			COALESCE(session_id, ''), 
			COALESCE(position, ''), 
			COALESCE(hole_cards, ''), 
			COALESCE(details, ''), 
			COALESCE(result_amount, 0), 
			COALESCE(analysis, ''), 
			COALESCE(analysis_date, ''), 
			COALESCE(is_favorite, false), 
			COALESCE(tag, ''), 
			COALESCE(board, ''), 
			COALESCE(note, ''), 
			COALESCE(villains, '[]'), 
			COALESCE(date, '')
		FROM hands 
		ORDER BY created_at DESC
	`)
	if err != nil {
		http.Error(w, "Query error: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()
	
	hands := []models.Hand{}
	for rows.Next() {
		var h models.Hand
		var villainsJSON string
		
		err := rows.Scan(
			&h.ID, 
			&h.SessionID, 
			&h.Position, 
			&h.HoleCards, 
			&h.Details, 
			&h.Result, 
			&h.Analysis, 
			&h.AnalysisDate, 
			&h.Favorite, 
			&h.Tag, 
			&h.Board, 
			&h.Note, 
			&villainsJSON, 
			&h.Date,
		)
		
		if err != nil {
			continue // 跳過錯誤的行
		}
		
		// 解析villains JSON
		if villainsJSON != "" && villainsJSON != "[]" {
			err := json.Unmarshal([]byte(villainsJSON), &h.Villains)
			if err != nil {
				h.Villains = []models.Villain{} // 如果解析失敗，設為空陣列
			}
		}
		
		hands = append(hands, h)
	}
	
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(hands)
}

func GetHand(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	if id == "" {
		http.Error(w, "Missing id parameter", http.StatusBadRequest)
		return
	}
	
	row := db.DB.QueryRow(`
		SELECT 
			id, 
			COALESCE(session_id, ''), 
			COALESCE(position, ''), 
			COALESCE(hole_cards, ''), 
			COALESCE(details, ''), 
			COALESCE(result_amount, 0), 
			COALESCE(analysis, ''), 
			COALESCE(analysis_date, ''), 
			COALESCE(is_favorite, false), 
			COALESCE(tag, ''), 
			COALESCE(board, ''), 
			COALESCE(note, ''), 
			COALESCE(villains, '[]'), 
			COALESCE(date, '')
		FROM hands 
		WHERE id = $1
	`, id)
	
	var h models.Hand
	var villainsJSON string
	
	err := row.Scan(
		&h.ID, 
		&h.SessionID, 
		&h.Position, 
		&h.HoleCards, 
		&h.Details, 
		&h.Result, 
		&h.Analysis, 
		&h.AnalysisDate, 
		&h.Favorite, 
		&h.Tag, 
		&h.Board, 
		&h.Note, 
		&villainsJSON, 
		&h.Date,
	)
	
	if err != nil {
		http.Error(w, "Hand not found: "+err.Error(), http.StatusNotFound)
		return
	}
	
	// 解析villains JSON
	if villainsJSON != "" && villainsJSON != "[]" {
		err := json.Unmarshal([]byte(villainsJSON), &h.Villains)
		if err != nil {
			h.Villains = []models.Villain{} // 如果解析失敗，設為空陣列
		}
	}
	
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Content-Type", "application/json")
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
	
	stmt, err := db.DB.Prepare(`UPDATE hands SET hole_cards = $1, board = $2, position = $3, details = $4, note = $5, result_amount = $6, date = $7, villains = $8, is_favorite = $9, tag = $10, analysis = $11 WHERE id = $12`)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer stmt.Close()
	
	_, err = stmt.Exec(hand.HoleCards, hand.Board, hand.Position, hand.Details, hand.Note, hand.Result, hand.Date, string(villainsJSON), hand.Favorite, "", hand.Analysis, id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	
	// 返回更新後的手牌
	row := db.DB.QueryRow(`SELECT id, COALESCE(session_id, '') as session_id, COALESCE(hole_cards, '') as hole_cards, COALESCE(board, '') as board, COALESCE(position, '') as position, COALESCE(details, '') as details, COALESCE(note, '') as note, COALESCE(result_amount, 0) as result_amount, COALESCE(date, '') as date, COALESCE(villains, '[]') as villains, COALESCE(analysis, '') as analysis, COALESCE(is_favorite, false) as is_favorite, COALESCE(tag, '') as tag FROM hands WHERE id = $1`, id)
	var updatedHand models.Hand
	var updatedVillainsJSON string
	var tag string
	err = row.Scan(&updatedHand.ID, &updatedHand.SessionID, &updatedHand.HoleCards, &updatedHand.Board, &updatedHand.Position, &updatedHand.Details, &updatedHand.Note, &updatedHand.Result, &updatedHand.Date, &updatedVillainsJSON, &updatedHand.Analysis, &updatedHand.Favorite, &tag)
	if err != nil {
		http.Error(w, "Failed to retrieve updated hand", http.StatusInternalServerError)
		return
	}
	
	// 設置空的 analysis_date
	updatedHand.AnalysisDate = ""
	
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
	if id == "" {
		http.Error(w, "Missing id parameter", http.StatusBadRequest)
		return
	}
	
	_, err := db.DB.Exec(`DELETE FROM hands WHERE id = $1`, id)
	if err != nil {
		http.Error(w, "Delete error: "+err.Error(), http.StatusInternalServerError)
		return
	}
	
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.WriteHeader(http.StatusNoContent)
}

func AnalyzeHand(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var request struct {
		Hand models.Hand `json:"hand"`
	}
	
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	hand := request.Hand
	
	// 確保手牌資料完整
	if hand.Details == "" {
		http.Error(w, "Hand details are required for analysis", http.StatusBadRequest)
		return
	}

	// 初始化 OpenAI 服務
	openaiService := services.NewOpenAIService()
	if openaiService == nil {
		http.Error(w, "OpenAI service not available - please check API key configuration", http.StatusServiceUnavailable)
		return
	}

	// 調用 OpenAI API 進行分析
	analysis, err := openaiService.AnalyzeHand(hand.Details, hand.Result)
	if err != nil {
		http.Error(w, "Analysis failed: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// ⚠️ 注意：分析結果不保存到後端資料庫，只返回給前端
	// 前端會將結果保存到本地 SQLite
	
	// 返回分析結果
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	analysisDate := time.Now().Format(time.RFC3339)
	response := map[string]string{
		"analysis": analysis,
		"date":     analysisDate,
	}
	json.NewEncoder(w).Encode(response)
}

func ToggleFavorite(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	id := r.URL.Query().Get("id")
	if id == "" {
		http.Error(w, "Hand ID is required", http.StatusBadRequest)
		return
	}

	// 獲取當前的 favorite 狀態
	var currentFavorite bool
	row := db.DB.QueryRow(`SELECT COALESCE(is_favorite, false) FROM hands WHERE id = $1`, id)
	if err := row.Scan(&currentFavorite); err != nil {
		http.Error(w, "Hand not found", http.StatusNotFound)
		return
	}

	// 切換 favorite 狀態
	newFavorite := !currentFavorite
	_, err := db.DB.Exec(`UPDATE hands SET is_favorite = $1 WHERE id = $2`, newFavorite, id)
	if err != nil {
		http.Error(w, "Failed to update favorite status: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// 返回新的狀態
	w.Header().Set("Content-Type", "application/json")
	response := map[string]bool{
		"favorite": newFavorite,
	}
	json.NewEncoder(w).Encode(response)
} 