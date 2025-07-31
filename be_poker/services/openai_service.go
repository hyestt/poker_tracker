package services

import (
	"context"
	"fmt"
	"os"
	"strings"

	"github.com/sashabaranov/go-openai"
	"poker_tracker_backend/models"
)

type OpenAIService struct {
	client *openai.Client
}

func NewOpenAIService() *OpenAIService {
	apiKey := os.Getenv("OPENAI_API_KEY")
	if apiKey == "" {
		return nil
	}
	
	client := openai.NewClient(apiKey)
	return &OpenAIService{client: client}
}

func (s *OpenAIService) AnalyzeHand(handDetails string, result int, position string, holeCards string, board string, villains []models.Villain) (string, error) {
	if s.client == nil {
		return "", fmt.Errorf("OpenAI service not available: API key not set")
	}

	// 組合完整的手牌信息
	var fullHandDetails strings.Builder
	fullHandDetails.WriteString(fmt.Sprintf("Hero Position: %s\n", position))
	fullHandDetails.WriteString(fmt.Sprintf("Hero Hole Cards: %s\n", holeCards))
	fullHandDetails.WriteString(fmt.Sprintf("Board: %s\n", board))
	
	// 添加 Villain 資訊
	if len(villains) > 0 {
		fullHandDetails.WriteString("\nVillains:\n")
		for i, villain := range villains {
			fullHandDetails.WriteString(fmt.Sprintf("Villain %d - Position: %s, Hole Cards: %s\n", 
				i+1, villain.Position, villain.HoleCards))
		}
	}
	
	fullHandDetails.WriteString(fmt.Sprintf("\nHand Action Details: %s", handDetails))
	
	// 使用prompt管理器獲取prompt
	promptManager := NewPromptManager()
	prompt, err := promptManager.GetHandAnalysisPrompt(fullHandDetails.String(), result)
	if err != nil {
		// 錯誤處理：記錄錯誤並使用fallback prompt
		fmt.Printf("Error reading prompt file: %v\n", err)
		prompt = fmt.Sprintf("As a professional poker coach, please analyze the following poker hand:\n\nHand Details: %s\nResult: %+d\n\nPlease provide analysis on:\n1. Technical Analysis: Was the hand played correctly\n2. Decision Evaluation: Quality of key decision points\n3. Improvement Suggestions: How to improve the play\n4. Learning Points: Key takeaways from this hand\n\nPlease respond in Traditional Chinese, keep it concise but insightful.", handDetails, result)
	} else {
		fmt.Printf("Successfully loaded prompt from file\n")
	}

	resp, err := s.client.CreateChatCompletion(
		context.Background(),
		openai.ChatCompletionRequest{
			Model: openai.GPT4oMini,
			Messages: []openai.ChatCompletionMessage{
				{
					Role:    openai.ChatMessageRoleUser,
					Content: prompt,
				},
			},
			MaxTokens:   2000,
			Temperature: 0.3,
		},
	)

	if err != nil {
		return "", fmt.Errorf("OpenAI API error: %v", err)
	}

	if len(resp.Choices) == 0 {
		return "", fmt.Errorf("No response from OpenAI")
	}

	return resp.Choices[0].Message.Content, nil
} 