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

// 讀取prompt文件並替換變數 (舊版本，保持向後兼容)
func (pm *PromptManager) GetHandAnalysisPrompt(handDetails string, language string) (string, error) {
	promptPath := filepath.Join(pm.promptsDir, "hand_analysis.txt")

	// 讀取prompt文件
	content, err := ioutil.ReadFile(promptPath)
	if err != nil {
		return "", fmt.Errorf("failed to read prompt file: %v", err)
	}

	// 替換變數
	prompt := string(content)
	prompt = strings.ReplaceAll(prompt, "{{HAND_DETAILS}}", handDetails)

	// 使用傳入的語言設定，如果為空則使用預設值
	if language == "" {
		language = "English"
	}
	prompt = strings.ReplaceAll(prompt, "{{LANGUAGE}}", language)

	return prompt, nil
}

// 新方法：分別獲取system和user prompts
func (pm *PromptManager) GetSystemPrompt(language string) (string, error) {
	promptPath := filepath.Join(pm.promptsDir, "system_prompt.txt")

	// 讀取system prompt文件
	content, err := ioutil.ReadFile(promptPath)
	if err != nil {
		return "", fmt.Errorf("failed to read system prompt file: %v", err)
	}

	// 替換語言變數
	prompt := string(content)
	if language == "" {
		language = "English"
	}
	prompt = strings.ReplaceAll(prompt, "{{LANGUAGE}}", language)

	return prompt, nil
}

func (pm *PromptManager) GetUserPrompt(handDetails string) (string, error) {
	promptPath := filepath.Join(pm.promptsDir, "user_prompt.txt")

	// 讀取user prompt文件
	content, err := ioutil.ReadFile(promptPath)
	if err != nil {
		return "", fmt.Errorf("failed to read user prompt file: %v", err)
	}

	// 替換手牌詳情變數
	prompt := string(content)
	prompt = strings.ReplaceAll(prompt, "{{HAND_DETAILS}}", handDetails)

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
