package services

import (
	"fmt"
	"io/ioutil"
	"path/filepath"
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
func (pm *PromptManager) GetHandAnalysisPrompt(handDetails string, result int) (string, error) {
	promptPath := filepath.Join(pm.promptsDir, "hand_analysis.txt")
	
	// 讀取prompt文件
	content, err := ioutil.ReadFile(promptPath)
	if err != nil {
		return "", fmt.Errorf("failed to read prompt file: %v", err)
	}
	
	// 替換變數
	prompt := string(content)
	prompt = strings.ReplaceAll(prompt, "{{HAND_DETAILS}}", handDetails)
	prompt = strings.ReplaceAll(prompt, "{{RESULT}}", fmt.Sprintf("%+d", result))
	
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