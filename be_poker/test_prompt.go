package main

import (
	"encoding/json"
	"fmt"
	"poker_tracker_backend/services"
)

func main() {
	pm := services.NewPromptManager()
	
	// 測試資料
	handDetails := ""
	language := "English"
	heroPosition := "BTN"
	holeCards := "9♣ A♣"
	board := "Q♥ J♥ T♦ 5♠ 2♦"
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
		fmt.Printf("Error: %v\n", err)
		return
	}
	
	// 解析並格式化輸出
	var data map[string]interface{}
	if err := json.Unmarshal([]byte(jsonStr), &data); err != nil {
		fmt.Printf("Failed to parse JSON: %v\n", err)
		return
	}
	
	// 只印出 hand_data 部分
	handData, ok := data["hand_data"].(map[string]interface{})
	if !ok {
		fmt.Println("No hand_data found")
		return
	}
	
	// 印出 hand_details
	if handDetails, ok := handData["hand_details"].(string); ok {
		fmt.Println("=== Hand Details ===")
		fmt.Println(handDetails)
		fmt.Println("===================")
	} else {
		fmt.Println("No hand_details found in hand_data")
	}
	
	// 印出 action_sequence
	if actionSeq, ok := handData["action_sequence"].(map[string]interface{}); ok {
		fmt.Println("\n=== Action Sequence ===")
		jsonBytes, _ := json.MarshalIndent(actionSeq, "", "  ")
		fmt.Println(string(jsonBytes))
		fmt.Println("======================")
	} else {
		fmt.Println("No action_sequence found in hand_data")
	}
}