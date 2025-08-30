package services

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"os"
	"strings"

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
		modelName: "gpt-5-mini", // default
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

	// handDetails 現在應為基於 user_prompt.json 的結構化 JSON，由上游 handler 組裝完成。
	// 不再回退到簡化 JSON；若不是 JSON，仍然直接傳遞（system prompt 會約束輸出）。
	userPrompt := strings.TrimSpace(handDetails)

	input := fmt.Sprintf("System:\n%s\n\nUser:\n%s", systemPrompt, userPrompt)

	// For gpt-5-mini, use raw HTTP to set reasoning/text prefs and json_object format
	if s.modelName == "gpt-5-mini" {
		out, err := s.callResponsesRaw(input)
		if err != nil {
			return "", err
		}
		return out, nil
	}

	params := responses.ResponseNewParams{
		Model:           s.modelName,
		Input:           responses.ResponseNewParamsInputUnion{OfString: param.NewOpt[string](input)},
		MaxOutputTokens: param.NewOpt[int64](2000),
	}

	resp, err := s.client.Responses.New(context.Background(), params)
	if err != nil {
		return "", fmt.Errorf("OpenAI API error: %w", err)
	}
	out := strings.TrimSpace(resp.OutputText())
	if out != "" {
		return out, nil
	}

	// Fallback: parse raw JSON and try to extract message/output_text
	raw := resp.RawJSON()
	var parsed map[string]any
	if err := json.Unmarshal([]byte(raw), &parsed); err == nil {
		if arr, ok := parsed["output"].([]any); ok {
			var b strings.Builder
			for _, it := range arr {
				itm, _ := it.(map[string]any)
				if itm == nil {
					continue
				}
				if t, _ := itm["type"].(string); t == "message" {
					if content, ok := itm["content"].([]any); ok {
						for _, c := range content {
							cm, _ := c.(map[string]any)
							if cm == nil {
								continue
							}
							if ct, _ := cm["type"].(string); ct == "output_text" {
								if txt, _ := cm["text"].(string); strings.TrimSpace(txt) != "" {
									if b.Len() > 0 {
										b.WriteString("\n")
									}
									b.WriteString(txt)
								}
							}
						}
					}
				}
			}
			if b.Len() > 0 {
				return b.String(), nil
			}
		}
	}

	return "", errors.New("empty OpenAI output")
}

// callResponsesRaw performs a manual HTTP POST to OpenAI Responses API so we can
// specify reasoning/text preferences and enforce JSON output format.
func (s *OpenAIService) callResponsesRaw(input string) (string, error) {
	apiKey := os.Getenv("OPENAI_API_KEY")
	if strings.TrimSpace(apiKey) == "" {
		return "", errors.New("missing OPENAI_API_KEY")
	}

	// Build strict JSON schema matching system prompt contract
	streetObj := func() map[string]any {
		return map[string]any{
			"type":                 "object",
			"additionalProperties": false,
			"properties": map[string]any{
				"player_action":   map[string]any{"type": "string"},
				"recommendation":  map[string]any{"type": "string"},
				"suggested_action": map[string]any{"type": "string"},
				"rating":          map[string]any{"type": "string"},
			},
			"required": []string{"player_action", "recommendation", "suggested_action", "rating"},
		}
	}
	rootSchema := map[string]any{
		"type":                 "object",
		"additionalProperties": false,
		"properties": map[string]any{
			"preflop": streetObj(),
			"flop":    streetObj(),
			"turn":    streetObj(),
			"river":   streetObj(),
		},
		"required": []string{"preflop", "flop", "turn", "river"},
	}

	body := map[string]any{
		"model":             s.modelName,
		"input":             input,
		"max_output_tokens": 3000,
		"reasoning":         map[string]any{"effort": "low"},
		// Responses API updated: use text.format for structured outputs
		"text": map[string]any{
			"format": map[string]any{
				"type":   "json_schema",
				"name":   "hand_analysis",
				"schema": rootSchema,
				"strict": true,
			},
		},
		"tool_choice": "none",
	}
	data, _ := json.Marshal(body)
	req, err := http.NewRequest("POST", "https://api.openai.com/v1/responses", bytes.NewReader(data))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+apiKey)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	var decoded map[string]any
	if err := json.NewDecoder(resp.Body).Decode(&decoded); err != nil {
		return "", err
	}

	// Prefer extracting structured JSON from output_json first
	if arr, ok := decoded["output"].([]any); ok {
		for _, it := range arr {
			itm, _ := it.(map[string]any)
			if itm == nil {
				continue
			}
			if t, _ := itm["type"].(string); t != "message" {
				continue
			}
			if content, ok := itm["content"].([]any); ok {
				for _, c := range content {
					cm, _ := c.(map[string]any)
					if cm == nil {
						continue
					}
					if ct, _ := cm["type"].(string); ct == "output_json" {
						var obj map[string]any
						if raw, ok := cm["json"]; ok {
							switch v := raw.(type) {
							case string:
								var o map[string]any
								if json.Unmarshal([]byte(v), &o) == nil {
									obj = o
								}
							case map[string]any:
								obj = v
							}
						}
						if obj == nil {
							if raw, ok := cm["parsed"]; ok {
								switch v := raw.(type) {
								case string:
									var o map[string]any
									if json.Unmarshal([]byte(v), &o) == nil {
										obj = o
									}
								case map[string]any:
									obj = v
								}
							}
						}
						if obj != nil {
							b, _ := json.Marshal(obj)
							return string(b), nil
						}
					}
				}
			}
		}
	}

	// If no output_json, prefer output_text aggregate if present
	if ot, ok := decoded["output_text"].(string); ok && strings.TrimSpace(ot) != "" {
		return strings.TrimSpace(ot), nil
	}

	// Otherwise, collect from output -> message -> content -> output_text
	if arr, ok := decoded["output"].([]any); ok {
		var b strings.Builder
		for _, it := range arr {
			itm, _ := it.(map[string]any)
			if itm == nil {
				continue
			}
			if t, _ := itm["type"].(string); t == "message" {
				if content, ok := itm["content"].([]any); ok {
					for _, c := range content {
						cm, _ := c.(map[string]any)
						if cm == nil {
							continue
						}
						if ct, _ := cm["type"].(string); ct == "output_text" {
							if txt, _ := cm["text"].(string); strings.TrimSpace(txt) != "" {
								if b.Len() > 0 {
									b.WriteString("\n")
								}
								b.WriteString(txt)
							}
						}
					}
				}
			}
		}
		if b.Len() > 0 {
			return b.String(), nil
		}
	}

	// Fallback: return raw JSON
	raw, _ := json.Marshal(decoded)
	return string(raw), nil
}
