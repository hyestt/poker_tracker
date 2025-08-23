package services

import "fmt"

// AIProvider 定義支援的 AI 提供商
type AIProvider string

const (
	OpenAIProvider AIProvider = "openai"
	ClaudeProvider AIProvider = "claude"
)

// AIModel 定義 AI 模型
type AIModel struct {
	Provider AIProvider `json:"provider"`
	Name     string     `json:"name"`
	Label    string     `json:"label"`
}

// 預定義的可用模型
var AvailableModels = []AIModel{
	{Provider: OpenAIProvider, Name: "gpt-4o", Label: "GPT-4o"},
	{Provider: OpenAIProvider, Name: "gpt-4o-mini", Label: "GPT-4o Mini"},
	{Provider: ClaudeProvider, Name: "claude-sonnet-4-20250514", Label: "Claude Sonnet 4"},
	{Provider: ClaudeProvider, Name: "claude-3-5-haiku-20241022", Label: "Claude 3.5 Haiku"},
	{Provider: ClaudeProvider, Name: "claude-3-opus-20240229", Label: "Claude 3 Opus"},
}

// AIService 定義統一的 AI 服務介面
type AIService interface {
	AnalyzeHand(handDetails string, language string) (string, error)
	GetProvider() AIProvider
	GetModelName() string
}

// AIServiceFactory 用於創建不同的 AI 服務實例
type AIServiceFactory struct{}

func NewAIServiceFactory() *AIServiceFactory {
	return &AIServiceFactory{}
}

// CreateService 根據提供商和模型創建對應的 AI 服務
func (f *AIServiceFactory) CreateService(provider AIProvider, modelName string) (AIService, error) {
	switch provider {
	case OpenAIProvider:
		service := NewOpenAIService()
		if service == nil {
			return nil, fmt.Errorf("OpenAI service not available: API key not set")
		}
		service.SetModel(modelName)
		return service, nil
	case ClaudeProvider:
		service := NewClaudeService()
		if service == nil {
			return nil, fmt.Errorf("Claude service not available: API key not set")
		}
		service.SetModel(modelName)
		return service, nil
	default:
		return nil, fmt.Errorf("unsupported AI provider: %s", provider)
	}
}

// GetAvailableModels 返回所有可用的模型
func (f *AIServiceFactory) GetAvailableModels() []AIModel {
	return AvailableModels
}

// GetModelByName 根據名稱查找模型
func (f *AIServiceFactory) GetModelByName(name string) *AIModel {
	for _, model := range AvailableModels {
		if model.Name == name {
			return &model
		}
	}
	return nil
}
