package main

import (
	"fmt"
	"io/ioutil"
	"log"
	"path/filepath"
	"poker_tracker_backend/services"
)

func main() {
	// Assuming we run this tool from be_poker directory
	handPath := filepath.Join("..", "hand_history.txt")

	content, err := ioutil.ReadFile(handPath)
	if err != nil {
		log.Fatalf("failed to read hand history: %v", err)
	}

	pm := services.NewPromptManager()

	// Demo structured JSON prompt with explicit fields
	heroPos := "MP"
	hole := "8h 6s"
	board := "8s 2h 6h Jd Ks"
	result := "+$0"
	notes := "No note"

	prompt, err := pm.GetJSONUserPrompt(string(content), "English", heroPos, hole, board, result, notes)
	if err != nil {
		log.Fatalf("failed to build prompt: %v", err)
	}

	fmt.Println(prompt)
}
