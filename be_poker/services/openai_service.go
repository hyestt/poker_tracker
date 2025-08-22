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

func (s *OpenAIService) AnalyzeHand(handDetails string, language string) (string, error) {
	if s.client == nil {
		return "", fmt.Errorf("OpenAI service not available: API key not set")
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

	// 獲取user prompt
	userPrompt, err := promptManager.GetUserPrompt(handDetails)
	if err != nil {
		// 錯誤處理：記錄錯誤並使用fallback user prompt
		fmt.Printf("Error reading user prompt file: %v\n", err)
		userPrompt = fmt.Sprintf("Please analyze the following poker hand:\n\n%s\n\nPlease provide analysis on:\n1. Technical Analysis: Was the hand played correctly\n2. Decision Evaluation: Quality of key decision points\n3. Improvement Suggestions: How to improve the play\n4. Learning Points: Key takeaways from this hand", handDetails)
	} else {
		fmt.Printf("Successfully loaded prompts from files\n")
	}

	resp, err := s.client.CreateChatCompletion(
		context.Background(),
		openai.ChatCompletionRequest{
			Model: openai.GPT4o,
			Messages: []openai.ChatCompletionMessage{
				{
					Role:    openai.ChatMessageRoleSystem,
					Content: systemPrompt,
				},
				{
					Role:    openai.ChatMessageRoleUser,
					Content: userPrompt,
				},
			},
			MaxTokens:   2000,
			Temperature: 0.0,
			TopP:        1.0,
		},
	)

	if err != nil {
		return "", fmt.Errorf("OpenAI API error: %v", err)
	}

	if len(resp.Choices) == 0 {
		return "", fmt.Errorf("no response from OpenAI")
	}

	return resp.Choices[0].Message.Content, nil
}
