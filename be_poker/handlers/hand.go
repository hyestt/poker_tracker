package handlers

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"poker_tracker_backend/db"
	"poker_tracker_backend/models"
	"poker_tracker_backend/services"
	"time"

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

	if db.DB == nil {
		http.Error(w, "Database not initialized", http.StatusInternalServerError)
		return
	}

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
	if len(hand.Villains) > 0 {
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

	stmt, err := db.DB.Prepare(`UPDATE hands SET hole_cards = $1, board = $2, position = $3, details = $4, note = $5, result_amount = $6, date = $7, villains = $8, is_favorite = $9, tag = $10, analysis = $11, analysis_sections = $12 WHERE id = $13`)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer stmt.Close()

	_, err = stmt.Exec(hand.HoleCards, hand.Board, hand.Position, hand.Details, hand.Note, hand.Result, hand.Date, string(villainsJSON), hand.Favorite, hand.Tag, hand.Analysis, hand.AnalysisJSON, id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// 返回更新後的手牌
	row := db.DB.QueryRow(`SELECT id, COALESCE(session_id, '') as session_id, COALESCE(hole_cards, '') as hole_cards, COALESCE(board, '') as board, COALESCE(position, '') as position, COALESCE(details, '') as details, COALESCE(note, '') as note, COALESCE(result_amount, 0) as result_amount, COALESCE(date, '') as date, COALESCE(villains, '[]') as villains, COALESCE(analysis, '') as analysis, COALESCE(is_favorite, false) as is_favorite, COALESCE(tag, '') as tag, COALESCE(analysis_sections, '') as analysis_sections FROM hands WHERE id = $1`, id)
	var updatedHand models.Hand
	var updatedVillainsJSON string
	var updatedAnalysisSectionsJSON string
	err = row.Scan(&updatedHand.ID, &updatedHand.SessionID, &updatedHand.HoleCards, &updatedHand.Board, &updatedHand.Position, &updatedHand.Details, &updatedHand.Note, &updatedHand.Result, &updatedHand.Date, &updatedVillainsJSON, &updatedHand.Analysis, &updatedHand.Favorite, &updatedHand.Tag, &updatedAnalysisSectionsJSON)
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

	// 直接回傳 analysis_sections 字串
	updatedHand.AnalysisJSON = updatedAnalysisSectionsJSON

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
		HandDetails string `json:"handDetails"`
		Language    string `json:"language,omitempty"`
		Model       string `json:"model,omitempty"` // 單模型（向後相容）
		Validate    bool   `json:"validate,omitempty"`
		Primary     string `json:"primary,omitempty"`
		Validator   string `json:"validator,omitempty"`
	}

	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// 確保手牌資料完整
	if request.HandDetails == "" {
		http.Error(w, "Hand details are required for analysis", http.StatusBadRequest)
		return
	}

	// 獲取語言設定，如果沒有則使用預設值
	language := request.Language
	if language == "" {
		language = "English"
	}

	// 預設開啟驗證：若未明確指定，設為 true。若明確傳 false 或 query ?validate=false 則關閉。
	if r.URL.Query().Get("validate") == "false" {
		request.Validate = false
	} else if r.URL.Query().Get("validate") == "true" {
		request.Validate = true
	} else {
		// body 未提供 validate，採用預設 true
		if !request.Validate {
			request.Validate = true
		}
	}

	// 單模型（向後相容）：當未開啟 validate 時，沿用原有流程
	if !request.Validate {
		// 獲取模型設定，如果沒有則使用預設值（OpenAI GPT-4o）
		modelName := request.Model
		if modelName == "" {
			modelName = "gpt-4o"
		}

		log.Printf("ℹ️ Using language: %s and model: %s for analysis", language, modelName)

		// 創建 AI 服務工廠
		aiFactory := services.NewAIServiceFactory()

		// 根據模型名稱確定提供商
		aiModel := aiFactory.GetModelByName(modelName)
		if aiModel == nil {
			http.Error(w, "Unsupported model: "+modelName, http.StatusBadRequest)
			return
		}

		// 創建對應的 AI 服務
		aiService, err := aiFactory.CreateService(aiModel.Provider, modelName)
		if err != nil {
			http.Error(w, "AI service not available: "+err.Error(), http.StatusServiceUnavailable)
			return
		}

		analysis, err := aiService.AnalyzeHand(request.HandDetails, language)
		if err != nil {
			http.Error(w, "Analysis failed: "+err.Error(), http.StatusInternalServerError)
			return
		}

		// 解析為 sections
		sections := services.ParseHandAnalysis(analysis)

		// 返回分析結果（含 sections）
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Access-Control-Allow-Origin", "*")
		analysisDate := time.Now().Format(time.RFC3339)
		response := map[string]interface{}{
			"analysis": analysis,
			"date":     analysisDate,
			"sections": sections,
		}
		json.NewEncoder(w).Encode(response)
		return
	}

	// 兩階段模式（primary+validator）。預設 primary=gpt-4o, validator=claude-sonnet-4-20250514
	primary := request.Primary
	if primary == "" {
		primary = "gpt-4o"
	}
	validator := request.Validator
	if validator == "" {
		validator = "claude-sonnet-4-20250514"
	}
	log.Printf("ℹ️ Two-stage analysis enabled. primary=%s validator=%s lang=%s", primary, validator, language)

	orch := services.NewTwoModelOrchestrator()
	result, err := orch.Run(r.Context(), request.HandDetails, language, primary, validator)
	if err != nil {
		http.Error(w, "Orchestrated analysis failed: "+err.Error(), http.StatusInternalServerError)
		return
	}

	sections := services.ParseHandAnalysis(result.FinalOutput)
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	analysisDate := time.Now().Format(time.RFC3339)
	response := map[string]interface{}{
		"analysis":          result.FinalOutput,
		"date":              analysisDate,
		"sections":          sections,
		"primary_output":    result.PrimaryOutput,
		"validation_report": result.Validation,
		"validation_status": result.ValidationState,
		"telemetry": map[string]int64{
			"primary_ms":   result.PrimaryMs,
			"validator_ms": result.ValidationMs,
		},
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
	if _, err := db.DB.Exec(`UPDATE hands SET is_favorite = $1 WHERE id = $2`, newFavorite, id); err != nil {
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

// GetAvailableModels 獲取所有可用的 AI 模型
func GetAvailableModels(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// 啟用 CORS
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	// 創建 AI 服務工廠並獲取可用模型
	aiFactory := services.NewAIServiceFactory()
	models := aiFactory.GetAvailableModels()

	response := struct {
		Models []services.AIModel `json:"models"`
	}{
		Models: models,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}
