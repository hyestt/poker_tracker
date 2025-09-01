package services

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"path/filepath"
	"regexp"
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
			Location string `json:"location,omitempty"`
			Stakes   struct {
				SmallBlind string `json:"small_blind"`
				BigBlind   string `json:"big_blind"`
			} `json:"stakes"`
			Date      string `json:"date,omitempty"`
			TableType string `json:"table_type,omitempty"`
		} `json:"session_info"`
		Hero struct {
			Position  string `json:"position"`
			HoleCards string `json:"hole_cards"`
			StackSize string `json:"stack_size,omitempty"`
		} `json:"hero"`
		Villains []struct {
			ID        string `json:"id,omitempty"`
			Position  string `json:"position"`
			HoleCards string `json:"hole_cards"`
			StackSize string `json:"stack_size,omitempty"`
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
		Result      string `json:"result,omitempty"`
		Notes       string `json:"notes,omitempty"`
	} `json:"hand_data"`
	AnalysisRequirements struct {
		Language           string   `json:"language"`
		OutputFormat       string   `json:"output_format"`
		IncludeFrequencies bool     `json:"include_frequencies"`
		IncludeRatings     bool     `json:"include_ratings"`
		GTOSolverStyle     bool     `json:"gto_solver_style"`
		StreetsToAnalyze   []string `json:"streets_to_analyze,omitempty"`
	} `json:"analysis_requirements"`
	PromptText string `json:"prompt_text"`
}

// normalizeSuits replaces suit symbols and shorthand letters with plural English words.
// Examples:
//   - "A♣ K♣" -> "Aclubs Kclubs"
//   - "A♦ 7♣ 2♠" -> "Adiamonds 7clubs 2spades"
//   - "Ac Kh Qd" -> "Aclubs Khearts Qdiamonds"
func normalizeSuits(s string) string {
	if s == "" {
		return s
	}

	// 1) Replace Unicode suit symbols with plural words
	replacer := strings.NewReplacer(
		"♣", "clubs",
		"♦", "diamonds",
		"♥", "hearts",
		"♠", "spades",
	)
	out := replacer.Replace(s)

	// 2) Replace shorthand suit letters when they appear as rank+suit tokens (e.g., Ac, Kh, Qd, 10s)
	//    Match tokens like: 10|[2-9]|[TJQKA] followed by [cdhs] at word boundary
	re := regexp.MustCompile(`(?i)\b(10|[2-9]|[tjqka])[cdhs]\b`)
	out = re.ReplaceAllStringFunc(out, func(m string) string {
		// last character is the suit letter
		suit := strings.ToLower(m[len(m)-1:])
		base := m[:len(m)-1]
		switch suit {
		case "c":
			return base + "clubs"
		case "d":
			return base + "diamonds"
		case "h":
			return base + "hearts"
		case "s":
			return base + "spades"
		default:
			return m
		}
	})

	// 3) Insert hyphen between rank and suit words, preserving trailing punctuation
	//    e.g., Aclubs -> A-clubs, 8spades -> 8-spades
	reHyphen := regexp.MustCompile(`(?i)(10|[2-9]|[tjqka])(clubs|diamonds|hearts|spades)([^A-Za-z]|$)`)
	out = reHyphen.ReplaceAllString(out, `$1-$2$3`)

	return out
}

// extractShortCards parses any card notation in a string and returns short codes like "9c", "Ad".
// It understands inputs like:
// - "9♣ A♦ K♦ J♠ 2♦"
// - "9 of clubs A of diamonds ..."
// - "9-clubs A-diamonds" (after normalizeSuits)
// - "Ac Kh Qd Js 2d"
func extractShortCards(s string) []string {
	if s == "" {
		return nil
	}

	// 1) Normalize suit symbols and words to single-letter suffix
	//    Convert unicode suits → letters
	repl := strings.NewReplacer(
		"♣", "c",
		"♦", "d",
		"♥", "h",
		"♠", "s",
		"-", " ",
	)
	out := repl.Replace(s)
	// convert words "of" and suit words to letters for easier matching
	out = strings.ReplaceAll(out, " of ", " ")
	out = regexp.MustCompile(`(?i)\bclubs\b`).ReplaceAllString(out, "c")
	out = regexp.MustCompile(`(?i)\bdiamonds\b`).ReplaceAllString(out, "d")
	out = regexp.MustCompile(`(?i)\bhearts\b`).ReplaceAllString(out, "h")
	out = regexp.MustCompile(`(?i)\bspades\b`).ReplaceAllString(out, "s")

	// 2) Find tokens like "10c" "9h" "Ac" etc (allow spaces between rank and suit)
	re := regexp.MustCompile(`(?i)\b(10|[2-9]|[tjqka])\s*([cdhs])\b`)
	matches := re.FindAllStringSubmatch(out, -1)
	var cards []string
	for _, m := range matches {
		rank := m[1]
		suit := strings.ToLower(m[2])
		// canonicalize rank: 10 → T, letters uppercase
		if rank == "10" {
			rank = "T"
		}
		rank = strings.ToUpper(rank)
		cards = append(cards, rank+suiteToLetter(suit))
	}
	return cards
}

func suiteToLetter(s string) string {
	switch strings.ToLower(s) {
	case "c":
		return "c"
	case "d":
		return "d"
	case "h":
		return "h"
	case "s":
		return "s"
	default:
		return s
	}
}

// ToShortCardString converts any recognizable card tokens into a compact
// space-separated string like "9h Ad Kd". Returns empty string if none found.
func ToShortCardString(s string) string {
	codes := extractShortCards(s)
	if len(codes) == 0 {
		return ""
	}
	return strings.Join(codes, " ")
}


// 新方法：獲取 JSON 格式的 user prompt
func (pm *PromptManager) GetJSONUserPrompt(handDetails, language, heroPosition, holeCards, board, result, notes, preflopDetails, flopDetails, turnDetails, riverDetails string) (string, error) {
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

	// 替換變數（花色正規化 + 短碼）
	prompt.HandData.HandDetails = normalizeSuits(handDetails)
	prompt.AnalysisRequirements.Language = language
	prompt.HandData.Hero.Position = heroPosition
	if sh := ToShortCardString(holeCards); sh != "" {
		prompt.HandData.Hero.HoleCards = sh
	} else {
		prompt.HandData.Hero.HoleCards = normalizeSuits(holeCards)
	}
	prompt.HandData.Result = result
	prompt.HandData.Notes = normalizeSuits(notes)

	// 處理 board 卡片使用短碼
	if board != "" {
		shorts := extractShortCards(board)
		if len(shorts) >= 3 {
			prompt.HandData.Board.Flop = strings.Join(shorts[:3], " ")
		}
		if len(shorts) >= 4 {
			prompt.HandData.Board.Turn = shorts[3]
		}
		if len(shorts) >= 5 {
			prompt.HandData.Board.River = shorts[4]
		}
	}
	
	// 直接將分階段詳情合併成完整的手牌詳情
	combinedDetails := ""
	if preflopDetails != "" {
		combinedDetails += "Preflop: " + normalizeSuits(preflopDetails) + "\n"
	}
	if flopDetails != "" {
		combinedDetails += "Flop: " + normalizeSuits(flopDetails) + "\n"
	}
	if turnDetails != "" {
		combinedDetails += "Turn: " + normalizeSuits(turnDetails) + "\n"
	}
	if riverDetails != "" {
		combinedDetails += "River: " + normalizeSuits(riverDetails) + "\n"
	}
	
	// 優先使用合併的分階段詳情，其次使用原始 handDetails
	// 確保 hand_details 不為空
	if combinedDetails != "" {
		prompt.HandData.HandDetails = strings.TrimSpace(combinedDetails)
	} else if handDetails != "" {
		prompt.HandData.HandDetails = normalizeSuits(handDetails)
	} else {
		// 如果都沒有，至少提供基本資訊
		prompt.HandData.HandDetails = fmt.Sprintf("Hero in %s with %s. Board: %s. Result: %s", 
			heroPosition, holeCards, board, result)
	}

	// 將修改後的 JSON 轉換回字串
	jsonBytes, err := json.MarshalIndent(prompt, "", "  ")
	if err != nil {
		return "", fmt.Errorf("failed to marshal JSON prompt: %v", err)
	}

	return string(jsonBytes), nil
}

// Deprecated: GetSimpleJSONUserPrompt was removed. Use GetJSONUserPrompt with user_prompt.json instead.

// 讀取 Validator Prompt 模板，並替換 {{LANGUAGE}}, {{ORIGINAL_HAND_JSON}}, {{PRIMARY_OUTPUT}}
func (pm *PromptManager) GetValidatorPrompt(originalHandJSON, primaryOutput, language string) (string, error) {
	path := filepath.Join(pm.promptsDir, "validator_prompt.txt")
	content, err := ioutil.ReadFile(path)
	if err != nil {
		return "", fmt.Errorf("failed to read validator prompt: %v", err)
	}
	prompt := string(content)
	if language == "" {
		language = "English"
	}
	prompt = strings.ReplaceAll(prompt, "{{LANGUAGE}}", language)
	prompt = strings.ReplaceAll(prompt, "{{ORIGINAL_HAND_JSON}}", originalHandJSON)
	prompt = strings.ReplaceAll(prompt, "{{PRIMARY_OUTPUT}}", primaryOutput)
	return prompt, nil
}
