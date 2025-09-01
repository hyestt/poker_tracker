package services

import (
	"encoding/json"
	"strings"
	"testing"
)

func TestGetJSONUserPromptWithStageDetails(t *testing.T) {
	pm := NewPromptManager()
	
	// 測試資料
	handDetails := ""
	language := "English"
	heroPosition := "BTN"
	holeCards := "9♣ A♣"
	board := "Q♥ J♥ T♦"
	result := "100"
	notes := "test note"
	preflopDetails := "UTG raises to 6, MP folds, CO folds, BTN calls 6"
	flopDetails := "UTG bets 8, BTN calls 8"
	turnDetails := "UTG checks, BTN bets 15, UTG calls 15"
	riverDetails := "UTG checks, BTN bets 30, UTG folds"
	
	// 執行函數
	jsonStr, err := pm.GetJSONUserPrompt(
		handDetails, language, heroPosition, holeCards, board, 
		result, notes, preflopDetails, flopDetails, turnDetails, riverDetails,
	)
	
	if err != nil {
		t.Fatalf("GetJSONUserPrompt failed: %v", err)
	}
	
	// 解析返回的 JSON
	var prompt JSONPrompt
	if err := json.Unmarshal([]byte(jsonStr), &prompt); err != nil {
		t.Fatalf("Failed to parse JSON: %v", err)
	}
	
	// 驗證 hand_details 包含分階段資訊
	if prompt.HandData.HandDetails == "" {
		t.Error("HandDetails is empty")
	}
	
	// 檢查是否包含各階段的詳情
	if !strings.Contains(prompt.HandData.HandDetails, "Preflop:") {
		t.Errorf("HandDetails doesn't contain Preflop section: %s", prompt.HandData.HandDetails)
	}
	if !strings.Contains(prompt.HandData.HandDetails, preflopDetails) {
		t.Errorf("HandDetails doesn't contain preflop details: %s", prompt.HandData.HandDetails)
	}
	
	if !strings.Contains(prompt.HandData.HandDetails, "Flop:") {
		t.Errorf("HandDetails doesn't contain Flop section: %s", prompt.HandData.HandDetails)
	}
	if !strings.Contains(prompt.HandData.HandDetails, flopDetails) {
		t.Errorf("HandDetails doesn't contain flop details: %s", prompt.HandData.HandDetails)
	}
	
	if !strings.Contains(prompt.HandData.HandDetails, "Turn:") {
		t.Errorf("HandDetails doesn't contain Turn section: %s", prompt.HandData.HandDetails)
	}
	if !strings.Contains(prompt.HandData.HandDetails, turnDetails) {
		t.Errorf("HandDetails doesn't contain turn details: %s", prompt.HandData.HandDetails)
	}
	
	if !strings.Contains(prompt.HandData.HandDetails, "River:") {
		t.Errorf("HandDetails doesn't contain River section: %s", prompt.HandData.HandDetails)
	}
	if !strings.Contains(prompt.HandData.HandDetails, riverDetails) {
		t.Errorf("HandDetails doesn't contain river details: %s", prompt.HandData.HandDetails)
	}
	
	// 印出實際的 JSON 供調試
	t.Logf("Generated JSON HandDetails: %s", prompt.HandData.HandDetails)
	
	// 驗證其他欄位
	if prompt.HandData.Hero.Position != heroPosition {
		t.Errorf("Hero position mismatch: got %s, want %s", prompt.HandData.Hero.Position, heroPosition)
	}
	
	if prompt.HandData.Hero.HoleCards != "9c Ac" {
		t.Errorf("Hero hole cards mismatch: got %s, want 9c Ac", prompt.HandData.Hero.HoleCards)
	}
}

func TestGetJSONUserPromptWithEmptyStageDetails(t *testing.T) {
	pm := NewPromptManager()
	
	// 測試只有 handDetails，沒有分階段詳情
	handDetails := "Original hand details text"
	language := "English"
	heroPosition := "BTN"
	holeCards := "9♣ A♣"
	board := "Q♥ J♥ T♦"
	result := "100"
	notes := "test note"
	
	// 執行函數，分階段詳情都是空的
	jsonStr, err := pm.GetJSONUserPrompt(
		handDetails, language, heroPosition, holeCards, board, 
		result, notes, "", "", "", "",
	)
	
	if err != nil {
		t.Fatalf("GetJSONUserPrompt failed: %v", err)
	}
	
	// 解析返回的 JSON
	var prompt JSONPrompt
	if err := json.Unmarshal([]byte(jsonStr), &prompt); err != nil {
		t.Fatalf("Failed to parse JSON: %v", err)
	}
	
	// 當沒有分階段詳情時，應該使用原始的 handDetails
	if !strings.Contains(prompt.HandData.HandDetails, "Original hand details") {
		t.Errorf("HandDetails should contain original text when stage details are empty: %s", prompt.HandData.HandDetails)
	}
}

func TestGetJSONUserPromptPartialStageDetails(t *testing.T) {
	pm := NewPromptManager()
	
	// 測試只有部分階段有詳情
	handDetails := ""
	language := "English"
	heroPosition := "BTN"
	holeCards := "9♣ A♣"
	board := "Q♥ J♥ T♦ 5♠ 2♦"
	result := "100"
	notes := ""
	preflopDetails := "UTG raises to 6, BTN calls 6"
	flopDetails := "UTG bets 8, BTN calls 8"
	turnDetails := ""  // 空的
	riverDetails := ""  // 空的
	
	// 執行函數
	jsonStr, err := pm.GetJSONUserPrompt(
		handDetails, language, heroPosition, holeCards, board, 
		result, notes, preflopDetails, flopDetails, turnDetails, riverDetails,
	)
	
	if err != nil {
		t.Fatalf("GetJSONUserPrompt failed: %v", err)
	}
	
	// 解析返回的 JSON
	var prompt JSONPrompt
	if err := json.Unmarshal([]byte(jsonStr), &prompt); err != nil {
		t.Fatalf("Failed to parse JSON: %v", err)
	}
	
	// 檢查只包含有內容的階段
	if !strings.Contains(prompt.HandData.HandDetails, "Preflop:") {
		t.Error("Should contain Preflop section")
	}
	if !strings.Contains(prompt.HandData.HandDetails, "Flop:") {
		t.Error("Should contain Flop section")
	}
	if strings.Contains(prompt.HandData.HandDetails, "Turn:") {
		t.Error("Should not contain empty Turn section")
	}
	if strings.Contains(prompt.HandData.HandDetails, "River:") {
		t.Error("Should not contain empty River section")
	}
	
	t.Logf("Partial stage details HandDetails: %s", prompt.HandData.HandDetails)
}