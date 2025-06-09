package services

import (
	"context"
	"fmt"
	"os"

	"github.com/sashabaranov/go-openai"
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

func (s *OpenAIService) AnalyzeHand(handDetails string, result int) (string, error) {
	if s.client == nil {
		return "", fmt.Errorf("OpenAI service not available: API key not set")
	}

	// 使用prompt管理器獲取prompt
	promptManager := NewPromptManager()
	prompt, err := promptManager.GetHandAnalysisPrompt(handDetails, result)
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
			MaxTokens:   800,
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