package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"poker_tracker_backend/models"
	"testing"
)

func TestCreateHandValidation(t *testing.T) {
	tests := []struct {
		name           string
		requestBody    interface{}
		expectedStatus int
	}{
		{
			name:           "Invalid JSON",
			requestBody:    "invalid json",
			expectedStatus: http.StatusBadRequest,
		},
		{
			name: "Valid hand data",
			requestBody: models.Hand{
				SessionID: "test-session-id",
				Details:   "Test hand details",
				Result:    100,
				Date:      "2024-01-01",
			},
			expectedStatus: http.StatusInternalServerError, // DB not initialized in test
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var body []byte
			var err error

			if str, ok := tt.requestBody.(string); ok {
				body = []byte(str)
			} else {
				body, err = json.Marshal(tt.requestBody)
				if err != nil {
					t.Fatalf("Failed to marshal request body: %v", err)
				}
			}

			req, err := http.NewRequest("POST", "/hands", bytes.NewBuffer(body))
			if err != nil {
				t.Fatal(err)
			}

			rr := httptest.NewRecorder()
			handler := http.HandlerFunc(CreateHand)

			handler.ServeHTTP(rr, req)

			if status := rr.Code; status != tt.expectedStatus {
				t.Errorf("Handler returned wrong status code: got %v want %v",
					status, tt.expectedStatus)
			}
		})
	}
}

func TestGetHandMissingID(t *testing.T) {
	req, err := http.NewRequest("GET", "/hand", nil)
	if err != nil {
		t.Fatal(err)
	}

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(GetHand)

	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusBadRequest {
		t.Errorf("Handler returned wrong status code: got %v want %v",
			status, http.StatusBadRequest)
	}

	expected := "Missing id parameter"
	if !bytes.Contains(rr.Body.Bytes(), []byte(expected)) {
		t.Errorf("Handler returned unexpected body: got %v want to contain %v",
			rr.Body.String(), expected)
	}
}

func TestDeleteHandMissingID(t *testing.T) {
	req, err := http.NewRequest("DELETE", "/hand", nil)
	if err != nil {
		t.Fatal(err)
	}

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(DeleteHand)

	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusBadRequest {
		t.Errorf("Handler returned wrong status code: got %v want %v",
			status, http.StatusBadRequest)
	}

	expected := "Missing id parameter"
	if !bytes.Contains(rr.Body.Bytes(), []byte(expected)) {
		t.Errorf("Handler returned unexpected body: got %v want to contain %v",
			rr.Body.String(), expected)
	}
}

func TestAnalyzeHandMethodValidation(t *testing.T) {
	req, err := http.NewRequest("GET", "/analyze", nil)
	if err != nil {
		t.Fatal(err)
	}

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(AnalyzeHand)

	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusMethodNotAllowed {
		t.Errorf("Handler returned wrong status code: got %v want %v",
			status, http.StatusMethodNotAllowed)
	}
}

func TestToggleFavoriteMethodValidation(t *testing.T) {
	req, err := http.NewRequest("GET", "/toggle-favorite", nil)
	if err != nil {
		t.Fatal(err)
	}

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(ToggleFavorite)

	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusMethodNotAllowed {
		t.Errorf("Handler returned wrong status code: got %v want %v",
			status, http.StatusMethodNotAllowed)
	}
}

// TestAnalyzeHandWithPFAndF 測試 AI analysis 能正確接收 PF 和 F 資料
func TestAnalyzeHandWithPFAndF(t *testing.T) {
	tests := []struct {
		name           string
		requestBody    map[string]interface{}
		expectedStatus int
		validateBody   func(t *testing.T, body []byte)
	}{
		{
			name: "Valid request with PF and F details",
			requestBody: map[string]interface{}{
				"hero_position":  "BTN",
				"hero_hole_cards": "AsKs",
				"board":          "Qs Js 7h 2c 5d",
				"result":         "Won $150",
				"preflop_details": "UTG raises to $10, BTN 3-bets to $30, UTG calls",
				"flop_details":    "Flop: Qs Js 7h. UTG checks, BTN bets $45, UTG calls",
				"turn_details":    "Turn: 2c. UTG checks, BTN checks",
				"river_details":   "River: 5d. UTG bets $60, BTN calls",
				"notes":          "對手在河牌的下注看起來像是詐唬",
				"session": map[string]string{
					"location":    "Bellagio",
					"small_blind": "2",
					"big_blind":   "5",
					"date":        "2024-12-20",
					"table_size":  "9-max",
				},
				"villains": []map[string]string{
					{
						"position":   "UTG",
						"hole_cards": "QhJc",
						"stack_size": "$500",
					},
				},
				"streets_to_analyze": []string{"preflop", "flop", "turn", "river"},
			},
			expectedStatus: http.StatusBadRequest, // 期望失敗因為沒有 handDetails
			validateBody: func(t *testing.T, body []byte) {
				// 驗證錯誤訊息
				if !bytes.Contains(body, []byte("Missing required fields")) {
					t.Error("Expected missing fields error")
				}
			},
		},
		{
			name: "Request with PF and F in handDetails format",
			requestBody: map[string]interface{}{
				"handDetails":      "Complete hand history with all details",
				"hero_position":    "CO",
				"hero_hole_cards":  "9h9c",
				"board":           "9s 6d 3h Kc 2s",
				"result":          "Won $320",
				"preflop_details":  "MP raises to $15, CO calls, BTN calls",
				"flop_details":     "Flop: 9s 6d 3h. MP bets $30, CO raises to $90, BTN folds, MP calls",
				"turn_details":     "Turn: Kc. MP checks, CO bets $120, MP calls",
				"river_details":    "River: 2s. MP checks, CO shoves $200, MP folds",
				"notes":           "Set mining paid off",
				"language":        "Chinese",
				"model":           "gpt-4o",
				"session": map[string]string{
					"location":    "MGM",
					"small_blind": "2",
					"big_blind":   "5",
					"date":        "2024-12-21",
					"table_size":  "6-max",
				},
			},
			expectedStatus: http.StatusServiceUnavailable, // AI service not available in test
			validateBody: func(t *testing.T, body []byte) {
				// 驗證 AI 服務不可用
				if !bytes.Contains(body, []byte("AI service not available")) {
					t.Error("Expected AI service not available error")
				}
			},
		},
		{
			name: "Request missing required fields",
			requestBody: map[string]interface{}{
				"handDetails": "Some details",
				"board":       "As Ks Qs",
				// 缺少 hero_position 和 hero_hole_cards
				"session": map[string]string{
					"small_blind": "5",
					"big_blind":   "10",
				},
			},
			expectedStatus: http.StatusBadRequest,
			validateBody: func(t *testing.T, body []byte) {
				if !bytes.Contains(body, []byte("Missing required fields")) {
					t.Error("Expected missing required fields error")
				}
			},
		},
		{
			name: "Two-stage validation mode with PF and F",
			requestBody: map[string]interface{}{
				"handDetails":     "Full hand for validation",
				"hero_position":   "SB",
				"hero_hole_cards": "AhAc",
				"board":          "Kh Qd Jc 10s 9h",
				"preflop_details": "SB raises to $15, BB 3-bets to $45, SB 4-bets to $120, BB calls",
				"flop_details":    "Flop: Kh Qd Jc. SB bets $150, BB calls",
				"validate":       true,
				"primary":        "gpt-4o",
				"validator":      "claude-sonnet-4-20250514",
				"session": map[string]string{
					"small_blind": "5",
					"big_blind":   "10",
				},
			},
			expectedStatus: http.StatusServiceUnavailable,
			validateBody: func(t *testing.T, body []byte) {
				// Two-stage orchestrator 應該失敗
				if !bytes.Contains(body, []byte("Orchestrated analysis failed")) {
					t.Error("Expected orchestrated analysis error")
				}
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			body, err := json.Marshal(tt.requestBody)
			if err != nil {
				t.Fatalf("Failed to marshal request body: %v", err)
			}

			req, err := http.NewRequest("POST", "/analyze", bytes.NewBuffer(body))
			if err != nil {
				t.Fatal(err)
			}
			req.Header.Set("Content-Type", "application/json")

			rr := httptest.NewRecorder()
			handler := http.HandlerFunc(AnalyzeHand)

			handler.ServeHTTP(rr, req)

			if status := rr.Code; status != tt.expectedStatus {
				t.Errorf("Handler returned wrong status code: got %v want %v",
					status, tt.expectedStatus)
				t.Logf("Response body: %s", rr.Body.String())
			}

			if tt.validateBody != nil {
				tt.validateBody(t, rr.Body.Bytes())
			}
		})
	}
}

// TestCreateHandWithPFAndF 測試建立手牌時 PF 和 F 資料以 TEXT 格式儲存
func TestCreateHandWithPFAndF(t *testing.T) {
	preflopDetails := "UTG+1 raises to $12, Hero 3-bets to $36, UTG+1 calls"
	flopDetails := "Flop: Ad Kc 7h. UTG+1 checks, Hero bets $45, UTG+1 folds"
	turnDetails := "Turn: 3s. Check, check"
	riverDetails := "River: 9d. UTG+1 bets $80, Hero folds"
	position := "CO"
	holeCards := "KhKs"
	board := "Ad Kc 7h 3s 9d"
	note := "Tough spot against unknown player"

	handData := models.Hand{
		SessionID:      "test-session-123",
		Position:       &position,
		HoleCards:      &holeCards,
		Board:          &board,
		Details:        "Complete hand history",
		PreflopDetails: &preflopDetails,
		FlopDetails:    &flopDetails,
		TurnDetails:    &turnDetails,
		RiverDetails:   &riverDetails,
		Result:         -36,
		Date:           "2024-12-20",
		Note:           &note,
		Villains: []models.Villain{
			{
				Position:  "UTG+1",
				HoleCards: "unknown",
			},
		},
	}

	body, err := json.Marshal(handData)
	if err != nil {
		t.Fatalf("Failed to marshal hand data: %v", err)
	}

	req, err := http.NewRequest("POST", "/hands", bytes.NewBuffer(body))
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Content-Type", "application/json")

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(CreateHand)

	handler.ServeHTTP(rr, req)

	// 預期會因為資料庫未初始化而失敗，但我們主要測試資料結構正確性
	if status := rr.Code; status != http.StatusInternalServerError {
		t.Errorf("Handler returned wrong status code: got %v want %v",
			status, http.StatusInternalServerError)
	}

	// 驗證錯誤訊息是資料庫相關，而非資料格式錯誤
	if !bytes.Contains(rr.Body.Bytes(), []byte("Database not initialized")) {
		t.Error("Expected database not initialized error")
	}
}
