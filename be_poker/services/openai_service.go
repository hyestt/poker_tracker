package services

import (
	"context"
	"fmt"
	"os"

	openai "github.com/openai/openai-go"
	"github.com/openai/openai-go/option"
	"github.com/openai/openai-go/packages/param"
	"github.com/openai/openai-go/responses"
)

type OpenAIService struct {
	client    openai.Client
	modelName string
}

func NewOpenAIService() *OpenAIService {
	apiKey := os.Getenv("OPENAI_API_KEY")
	if apiKey == "" {
		return nil
	}

	client := openai.NewClient(option.WithAPIKey(apiKey))
	return &OpenAIService{
		client:    client,
		modelName: "gpt-5-mini", // 預設模型
	}
}

// SetModel 設定要使用的模型
func (s *OpenAIService) SetModel(modelName string) {
	s.modelName = modelName
}

// GetProvider 返回提供商名稱
func (s *OpenAIService) GetProvider() AIProvider {
	return OpenAIProvider
}

// GetModelName 返回當前使用的模型名稱
func (s *OpenAIService) GetModelName() string {
	return s.modelName
}

func (s *OpenAIService) AnalyzeHand(handDetails string, language string) (string, error) {
	// 使用prompt管理器獲取分離的system和user prompts
	pm := NewPromptManager()
	systemPrompt, err := pm.GetSystemPrompt(language)
	if err != nil {
		systemPrompt = fmt.Sprintf("You are a professional Texas Hold'em poker GTO coach. Analyze poker hands and provide strategic recommendations in %s.", language)
	}
	userPrompt, err := pm.GetSimpleJSONUserPrompt(handDetails, language)
	if err != nil {
		userPrompt = fmt.Sprintf("Please analyze the following poker hand:\n\n%s", handDetails)
	}

	input := fmt.Sprintf("System:\n%s\n\nUser:\n%s", systemPrompt, userPrompt)
	params := responses.ResponseNewParams{
		Model:           s.modelName,
		Input:           responses.ResponseNewParamsInputUnion{OfString: param.NewOpt[string](input)},
		MaxOutputTokens: param.NewOpt[int64](1800),
	}

	resp, err := s.client.Responses.New(context.Background(), params)
	if err != nil {
		return "", fmt.Errorf("OpenAI API error: %w", err)
	}
	out := resp.OutputText()
	if out == "" {
		return resp.RawJSON(), nil
	}
	return out, nil
}
