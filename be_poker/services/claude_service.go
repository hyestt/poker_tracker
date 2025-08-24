package services

import (
	"context"
	"fmt"
	"os"

	"github.com/liushuangls/go-anthropic"
)

type ClaudeService struct {
	client    *anthropic.Client
	modelName string
}

func NewClaudeService() *ClaudeService {
	apiKey := os.Getenv("ANTHROPIC_API_KEY")
	if apiKey == "" {
		return nil
	}

	client := anthropic.NewClient(apiKey)
	return &ClaudeService{
		client:    client,
		modelName: "claude-sonnet-4-20250514", // 預設模型 - Sonnet 4
	}
}

// SetModel 設定要使用的模型
func (s *ClaudeService) SetModel(modelName string) {
	s.modelName = modelName
}

// GetProvider 返回提供商名稱
func (s *ClaudeService) GetProvider() AIProvider {
	return ClaudeProvider
}

// GetModelName 返回當前使用的模型名稱
func (s *ClaudeService) GetModelName() string {
	return s.modelName
}

func (s *ClaudeService) AnalyzeHand(handDetails string, language string) (string, error) {
	if s.client == nil {
		return "", fmt.Errorf("Claude service not available: API key not set")
	}

	// 使用prompt管理器獲取分離的system和user prompts
	promptManager := NewPromptManager()

	// 獲取system prompt
	systemPrompt, err := promptManager.GetSystemPrompt(language)
	if err != nil {
		// 錯誤處理：記錄錯誤並使用fallback system prompt
		fmt.Printf("Error reading system prompt file: %v\n", err)
		systemPrompt = fmt.Sprintf("You are a professional Texas Hold'em poker GTO coach. Analyze poker hands and provide strategic recommendations in %s.", language)
	}

	// 獲取user prompt（使用 JSON 格式）
	userPrompt, err := promptManager.GetSimpleJSONUserPrompt(handDetails, language)
	if err != nil {
		// 如果 JSON 格式失敗，使用硬編碼的fallback prompt
		fmt.Printf("JSON prompt failed, using fallback prompt: %v\n", err)
		userPrompt = fmt.Sprintf("Please analyze the following poker hand:\n\n%s\n\nPlease provide analysis on:\n1. Technical Analysis: Was the hand played correctly\n2. Decision Evaluation: Quality of key decision points\n3. Improvement Suggestions: How to improve the play\n4. Learning Points: Key takeaways from this hand", handDetails)
	} else {
		fmt.Printf("Successfully loaded JSON prompts from files\n")
	}

	resp, err := s.client.CreateMessages(
		context.Background(),
		anthropic.MessagesRequest{
			Model:     s.modelName,
			MaxTokens: 1500,
			System:    systemPrompt,
			Messages: []anthropic.Message{
				anthropic.NewUserTextMessage(userPrompt),
			},
		},
	)

	if err != nil {
		return "", fmt.Errorf("Claude API error: %v", err)
	}

	if len(resp.Content) == 0 {
		return "", fmt.Errorf("no response from Claude")
	}

	// 提取文字回應 - 使用 v1 API 的 GetFirstContentText 方法
	text := resp.GetFirstContentText()
	if text == "" {
		return "", fmt.Errorf("no text content in Claude response")
	}

	return text, nil
}
