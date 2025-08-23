package services

import (
	"encoding/json"
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

// JSON prompt 結構定義
type JSONPrompt struct {
	RequestType    string `json:"request_type"`
	AnalysisFormat string `json:"analysis_format"`
	HandData       struct {
		SessionInfo struct {
			Location string `json:"location"`
			Stakes   struct {
				SmallBlind string `json:"small_blind"`
				BigBlind   string `json:"big_blind"`
			} `json:"stakes"`
			Date      string `json:"date"`
			TableType string `json:"table_type"`
		} `json:"session_info"`
		Hero struct {
			Position  string `json:"position"`
			HoleCards string `json:"hole_cards"`
			StackSize string `json:"stack_size"`
		} `json:"hero"`
		Villains []struct {
			ID        string `json:"id"`
			Position  string `json:"position"`
			HoleCards string `json:"hole_cards"`
			StackSize string `json:"stack_size"`
		} `json:"villains"`
		Board struct {
			Flop  string `json:"flop"`
			Turn  string `json:"turn"`
			River string `json:"river"`
		} `json:"board"`
		ActionSequence struct {
			Preflop []struct {
				Player       string `json:"player"`
				Action       string `json:"action"`
				Amount       string `json:"amount"`
				PotSizeAfter string `json:"pot_size_after"`
			} `json:"preflop"`
			Flop  []interface{} `json:"flop"`
			Turn  []interface{} `json:"turn"`
			River []interface{} `json:"river"`
		} `json:"action_sequence"`
		HandDetails string `json:"hand_details"`
		Result      string `json:"result"`
		Notes       string `json:"notes"`
	} `json:"hand_data"`
	AnalysisRequirements struct {
		Language           string   `json:"language"`
		OutputFormat       string   `json:"output_format"`
		IncludeFrequencies bool     `json:"include_frequencies"`
		IncludeRatings     bool     `json:"include_ratings"`
		GTOSolverStyle     bool     `json:"gto_solver_style"`
		StreetsToAnalyze   []string `json:"streets_to_analyze"`
	} `json:"analysis_requirements"`
	PromptText string `json:"prompt_text"`
}

// 新方法：獲取 JSON 格式的 user prompt
func (pm *PromptManager) GetJSONUserPrompt(handDetails, language, heroPosition, holeCards, board, result, notes string) (string, error) {
	promptPath := filepath.Join(pm.promptsDir, "user_prompt.json")

	// 讀取 JSON prompt 模板
	content, err := ioutil.ReadFile(promptPath)
	if err != nil {
		return "", fmt.Errorf("failed to read JSON prompt file: %v", err)
	}

	// 解析 JSON
	var prompt JSONPrompt
	if err := json.Unmarshal(content, &prompt); err != nil {
		return "", fmt.Errorf("failed to parse JSON prompt: %v", err)
	}

	// 替換變數
	prompt.HandData.HandDetails = handDetails
	prompt.AnalysisRequirements.Language = language
	prompt.HandData.Hero.Position = heroPosition
	prompt.HandData.Hero.HoleCards = holeCards
	prompt.HandData.Result = result
	prompt.HandData.Notes = notes

	// 處理 board 卡片
	if board != "" {
		boardCards := strings.Fields(board)
		if len(boardCards) >= 3 {
			prompt.HandData.Board.Flop = strings.Join(boardCards[:3], " ")
		}
		if len(boardCards) >= 4 {
			prompt.HandData.Board.Turn = boardCards[3]
		}
		if len(boardCards) >= 5 {
			prompt.HandData.Board.River = boardCards[4]
		}
	}

	// 將修改後的 JSON 轉換回字串
	jsonBytes, err := json.MarshalIndent(prompt, "", "  ")
	if err != nil {
		return "", fmt.Errorf("failed to marshal JSON prompt: %v", err)
	}

	return string(jsonBytes), nil
}

// 獲取簡化的 JSON user prompt（只包含必要資訊）
func (pm *PromptManager) GetSimpleJSONUserPrompt(handDetails, language string) (string, error) {
	simplePrompt := map[string]interface{}{
		"request_type": "poker_hand_analysis",
		"hand_details": handDetails,
		"language":     language,
		"prompt_text":  "Please analyze the following poker hand using GTO solver principles. Provide comprehensive analysis including action frequencies, ratings, and strategic recommendations for each street. Follow the format and rules specified in the system prompt.",
	}

	jsonBytes, err := json.MarshalIndent(simplePrompt, "", "  ")
	if err != nil {
		return "", fmt.Errorf("failed to marshal simple JSON prompt: %v", err)
	}

	return string(jsonBytes), nil
}
