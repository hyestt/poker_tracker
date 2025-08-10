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

// parseBoard 解析 board 字串，分割成 flop/turn/river
func parseBoard(board string) (flop, turn, river string) {
	if len(board) < 6 { // 至少需要3張牌(flop)，每張2字符
		return "", "", ""
	}
	
	// 每張牌2字符，如 "AH"
	cards := make([]string, 0, 5)
	for i := 0; i < len(board); i += 2 {
		if i+1 < len(board) {
			cards = append(cards, board[i:i+2])
		}
	}
	
	if len(cards) >= 3 {
		flop = strings.Join(cards[0:3], " ") // "AH 7S 2D"
	}
	if len(cards) >= 4 {
		turn = cards[3] // "5S"
	}
	if len(cards) >= 5 {
		river = cards[4] // "KS"
	}
	
	return flop, turn, river
}

// formatHoleCards 格式化底牌，確保空格分隔格式
func formatHoleCards(holeCards string) string {
	if len(holeCards) == 4 { // 如 "AHKS" 
		return holeCards[0:2] + " " + holeCards[2:4] // "AH KS"
	}
	return holeCards // 已經是正確格式或空字串
}

func (s *OpenAIService) AnalyzeHand(handDetails string, result int, position string, holeCards string, board string, villains []models.Villain, smallBlind int, bigBlind int) (string, error) {
	if s.client == nil {
		return "", fmt.Errorf("OpenAI service not available: API key not set")
	}

	// 組合完整的手牌信息
	var fullHandDetails strings.Builder
	fullHandDetails.WriteString(fmt.Sprintf("Session Blinds: %d/%d\n", smallBlind, bigBlind))
	fullHandDetails.WriteString(fmt.Sprintf("Hero Position: %s\n", position))
	fullHandDetails.WriteString(fmt.Sprintf("Hero Hole Cards: %s\n", formatHoleCards(holeCards)))
	
	// 解析並格式化 board
	if board != "" {
		flop, turn, river := parseBoard(board)
		
		if flop != "" {
			fullHandDetails.WriteString(fmt.Sprintf("Flop: %s\n", flop))
		}
		if turn != "" {
			fullHandDetails.WriteString(fmt.Sprintf("Turn: %s\n", turn))
		}
		if river != "" {
			fullHandDetails.WriteString(fmt.Sprintf("River: %s\n", river))
		}
	}
	
	// 添加 Villain 資訊
	if len(villains) > 0 {
		fullHandDetails.WriteString("\nVillains:\n")
		for i, villain := range villains {
			villainCards := formatHoleCards(villain.HoleCards)
			fullHandDetails.WriteString(fmt.Sprintf("Villain %d - Position: %s, Hole Cards: %s\n", 
				i+1, villain.Position, villainCards))
		}
	}
	
	fullHandDetails.WriteString(fmt.Sprintf("\nHand Action Details: %s", handDetails))
	
	// 使用prompt管理器獲取prompt
	promptManager := NewPromptManager()
	prompt, err := promptManager.GetHandAnalysisPrompt(fullHandDetails.String(), result, smallBlind, bigBlind)
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