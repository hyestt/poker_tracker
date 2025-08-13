package services

import (
	"fmt"
	"io/ioutil"
	"path/filepath"
	"poker_tracker_backend/models"
	"strings"
)

type PromptManager struct {
	promptsDir string
}

func NewPromptManager() *PromptManager {
	return &PromptManager{
		promptsDir: "prompts",
	}
}

// 讀取prompt文件並替換變數
func (pm *PromptManager) GetHandAnalysisPrompt(handDetails string, result int, smallBlind int, bigBlind int, heroPosition string, heroHand string, flop string, turn string, river string, villains []models.Villain) (string, error) {
	promptPath := filepath.Join(pm.promptsDir, "hand_analysis.txt")

	// 讀取prompt文件
	content, err := ioutil.ReadFile(promptPath)
	if err != nil {
		return "", fmt.Errorf("failed to read prompt file: %v", err)
	}

	// 格式化villains信息
	var villainsText strings.Builder
	if len(villains) > 0 {
		villainsText.WriteString("Villains:\n")
		for i, villain := range villains {
			villainsText.WriteString(fmt.Sprintf("Villain %d - Position: %s, Hole Cards: %s\n",
				i+1, villain.Position, villain.HoleCards))
		}
	} else {
		villainsText.WriteString("Villains: None\n")
	}

	// 替換變數
	prompt := string(content)
	prompt = strings.ReplaceAll(prompt, "{{HAND_DETAILS}}", handDetails)
	prompt = strings.ReplaceAll(prompt, "{{RESULT}}", fmt.Sprintf("%+d", result))
	prompt = strings.ReplaceAll(prompt, "{{SMALL_BLIND}}", fmt.Sprintf("%d", smallBlind))
	prompt = strings.ReplaceAll(prompt, "{{BIG_BLIND}}", fmt.Sprintf("%d", bigBlind))
	prompt = strings.ReplaceAll(prompt, "{{HERO_POSITION}}", heroPosition)
	prompt = strings.ReplaceAll(prompt, "{{HERO_HAND}}", heroHand)
	prompt = strings.ReplaceAll(prompt, "{{FLOP}}", flop)
	prompt = strings.ReplaceAll(prompt, "{{TURN}}", turn)
	prompt = strings.ReplaceAll(prompt, "{{RIVER}}", river)
	prompt = strings.ReplaceAll(prompt, "{{VILLAINS}}", villainsText.String())
	prompt = strings.ReplaceAll(prompt, "{{LANGUAGE}}", "Traditional Chinese")

	return prompt, nil
}

// 獲取所有可用的prompt文件列表
func (pm *PromptManager) ListPrompts() ([]string, error) {
	files, err := ioutil.ReadDir(pm.promptsDir)
	if err != nil {
		return nil, fmt.Errorf("failed to read prompts directory: %v", err)
	}

	var prompts []string
	for _, file := range files {
		if filepath.Ext(file.Name()) == ".txt" {
			prompts = append(prompts, file.Name())
		}
	}

	return prompts, nil
}

// 讀取原始prompt內容（用於編輯）
func (pm *PromptManager) GetRawPrompt(filename string) (string, error) {
	promptPath := filepath.Join(pm.promptsDir, filename)
	content, err := ioutil.ReadFile(promptPath)
	if err != nil {
		return "", fmt.Errorf("failed to read prompt file: %v", err)
	}
	return string(content), nil
}
