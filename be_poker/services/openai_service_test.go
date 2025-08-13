package services

import (
	"poker_tracker_backend/models"
	"strings"
	"testing"
)

func TestConvertUnicodeSuitsToLetters(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string
	}{
		// Single card conversions
		{
			name:     "Ace of Spades",
			input:    "A♠",
			expected: "AS",
		},
		{
			name:     "King of Hearts",
			input:    "K♥",
			expected: "KH",
		},
		{
			name:     "Queen of Diamonds",
			input:    "Q♦",
			expected: "QD",
		},
		{
			name:     "Jack of Clubs",
			input:    "J♣",
			expected: "JC",
		},
		{
			name:     "Ten of Spades",
			input:    "T♠",
			expected: "TS",
		},
		{
			name:     "Nine of Hearts",
			input:    "9♥",
			expected: "9H",
		},
		{
			name:     "Two of Clubs",
			input:    "2♣",
			expected: "2C",
		},
		// Multiple card strings
		{
			name:     "Two cards space separated",
			input:    "A♠ K♥",
			expected: "AS KH",
		},
		{
			name:     "Three cards space separated",
			input:    "A♠ K♥ Q♦",
			expected: "AS KH QD",
		},
		{
			name:     "Five card board",
			input:    "A♠ K♥ Q♦ J♣ T♠",
			expected: "AS KH QD JC TS",
		},
		// Board parsing without spaces (just converts suits, doesn't add spaces)
		{
			name:     "Flop cards concatenated",
			input:    "A♠K♥Q♦",
			expected: "ASKHQD",
		},
		{
			name:     "Turn cards concatenated",
			input:    "A♠K♥Q♦J♣",
			expected: "ASKHQDJC",
		},
		{
			name:     "River cards concatenated",
			input:    "A♠K♥Q♦J♣T♠",
			expected: "ASKHQDJCTS",
		},
		// Edge cases
		{
			name:     "Empty string",
			input:    "",
			expected: "",
		},
		{
			name:     "String with no suits",
			input:    "AK",
			expected: "AK",
		},
		{
			name:     "Mixed format",
			input:    "AS K♥",
			expected: "AS KH",
		},
		{
			name:     "Already converted format",
			input:    "AS KH QD JC",
			expected: "AS KH QD JC",
		},
		// Invalid input handling
		{
			name:     "Invalid suit symbol",
			input:    "A★",
			expected: "A★",
		},
		{
			name:     "Single suit without rank",
			input:    "♠",
			expected: "S",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := convertUnicodeSuitsToLetters(tt.input)
			if result != tt.expected {
				t.Errorf("convertUnicodeSuitsToLetters(%q) = %q, want %q", tt.input, result, tt.expected)
			}
		})
	}
}

func TestParseBoardWithConversion(t *testing.T) {
	tests := []struct {
		name         string
		board        string
		expectedFlop string
		expectedTurn string
		expectedRiver string
	}{
		{
			name:          "Unicode flop only",
			board:         "A♠K♥Q♦",
			expectedFlop:  "AS KH QD",
			expectedTurn:  "",
			expectedRiver: "",
		},
		{
			name:          "Unicode flop and turn",
			board:         "A♠K♥Q♦J♣",
			expectedFlop:  "AS KH QD",
			expectedTurn:  "JC",
			expectedRiver: "",
		},
		{
			name:          "Unicode full board",
			board:         "A♠K♥Q♦J♣T♠",
			expectedFlop:  "AS KH QD",
			expectedTurn:  "JC",
			expectedRiver: "TS",
		},
		{
			name:          "Already letter format",
			board:         "ASKHQD",
			expectedFlop:  "AS KH QD",
			expectedTurn:  "",
			expectedRiver: "",
		},
		{
			name:          "Empty board",
			board:         "",
			expectedFlop:  "",
			expectedTurn:  "",
			expectedRiver: "",
		},
		{
			name:          "Invalid short board",
			board:         "A♠",
			expectedFlop:  "",
			expectedTurn:  "",
			expectedRiver: "",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// First convert the board
			convertedBoard := convertUnicodeSuitsToLetters(tt.board)
			
			// Then parse it
			flop, turn, river := parseBoard(convertedBoard)
			
			if flop != tt.expectedFlop {
				t.Errorf("parseBoard flop = %q, want %q", flop, tt.expectedFlop)
			}
			if turn != tt.expectedTurn {
				t.Errorf("parseBoard turn = %q, want %q", turn, tt.expectedTurn)
			}
			if river != tt.expectedRiver {
				t.Errorf("parseBoard river = %q, want %q", river, tt.expectedRiver)
			}
		})
	}
}

func TestFormatHoleCardsWithConversion(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{
			name:     "Unicode hole cards",
			input:    "A♠K♥",
			expected: "AS KH",
		},
		{
			name:     "Unicode hole cards with space",
			input:    "A♠ K♥",
			expected: "AS KH", // formatHoleCards will preserve space after conversion
		},
		{
			name:     "Letter format",
			input:    "ASKH",
			expected: "AS KH",
		},
		{
			name:     "Already formatted",
			input:    "AS KH",
			expected: "AS KH",
		},
		{
			name:     "Empty string",
			input:    "",
			expected: "",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Convert before formatting
			converted := convertUnicodeSuitsToLetters(tt.input)
			result := formatHoleCards(converted)
			
			if result != tt.expected {
				t.Errorf("formatHoleCards(convertUnicodeSuitsToLetters(%q)) = %q, want %q", tt.input, result, tt.expected)
			}
		})
	}
}

func TestVillainCardConversion(t *testing.T) {
	tests := []struct {
		name     string
		villains []models.Villain
		expected []models.Villain
	}{
		{
			name: "Single villain with unicode cards",
			villains: []models.Villain{
				{ID: "v1", Position: "UTG", HoleCards: "A♠K♥"},
			},
			expected: []models.Villain{
				{ID: "v1", Position: "UTG", HoleCards: "AS KH"},
			},
		},
		{
			name: "Multiple villains with mixed formats",
			villains: []models.Villain{
				{ID: "v1", Position: "UTG", HoleCards: "A♠K♥"},
				{ID: "v2", Position: "BTN", HoleCards: "QDJC"},
				{ID: "v3", Position: "SB", HoleCards: "T♠9♠"},
			},
			expected: []models.Villain{
				{ID: "v1", Position: "UTG", HoleCards: "AS KH"},
				{ID: "v2", Position: "BTN", HoleCards: "QD JC"},
				{ID: "v3", Position: "SB", HoleCards: "TS 9S"},
			},
		},
		{
			name:     "Empty villains slice",
			villains: []models.Villain{},
			expected: []models.Villain{},
		},
		{
			name: "Villain with empty hole cards",
			villains: []models.Villain{
				{ID: "v1", Position: "UTG", HoleCards: ""},
			},
			expected: []models.Villain{
				{ID: "v1", Position: "UTG", HoleCards: ""},
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Convert villain cards
			result := make([]models.Villain, len(tt.villains))
			for i, villain := range tt.villains {
				result[i] = models.Villain{
					ID:        villain.ID,
					Position:  villain.Position,
					HoleCards: formatHoleCards(convertUnicodeSuitsToLetters(villain.HoleCards)),
				}
			}
			
			if len(result) != len(tt.expected) {
				t.Errorf("Length mismatch: got %d, want %d", len(result), len(tt.expected))
				return
			}
			
			for i, expected := range tt.expected {
				if result[i].HoleCards != expected.HoleCards {
					t.Errorf("Villain %d HoleCards = %q, want %q", i, result[i].HoleCards, expected.HoleCards)
				}
			}
		})
	}
}

func TestSuitConversionEdgeCases(t *testing.T) {
	tests := []struct {
		name        string
		input       string
		expected    string
		description string
	}{
		{
			name:        "Multiple spaces",
			input:       "A♠  K♥",
			expected:    "AS  KH",
			description: "Should preserve spacing",
		},
		{
			name:        "Tabs and spaces",
			input:       "A♠\tK♥",
			expected:    "AS\tKH",
			description: "Should preserve tabs",
		},
		{
			name:        "Newlines",
			input:       "A♠\nK♥",
			expected:    "AS\nKH",
			description: "Should preserve newlines",
		},
		{
			name:        "Mixed case ranks",
			input:       "a♠k♥",
			expected:    "aSkH", // Simple replacement doesn't validate card combinations
			description: "Simple replacement converts all suit symbols",
		},
		{
			name:        "Special characters",
			input:       "A♠-K♥",
			expected:    "AS-KH",
			description: "Should preserve special characters",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := convertUnicodeSuitsToLetters(tt.input)
			if result != tt.expected {
				t.Errorf("convertUnicodeSuitsToLetters(%q) = %q, want %q (%s)", 
					tt.input, result, tt.expected, tt.description)
			}
		})
	}
}

func TestIntegrationCardFlow(t *testing.T) {
	// Test the complete flow from frontend format to AI-ready format
	tests := []struct {
		name           string
		heroCards      string
		board          string
		expectedHero   string
		expectedFlop   string
		expectedTurn   string
		expectedRiver  string
	}{
		{
			name:           "Complete hand with unicode",
			heroCards:      "A♠K♥",
			board:          "A♦K♠Q♥J♣T♠",
			expectedHero:   "AS KH",
			expectedFlop:   "AD KS QH",
			expectedTurn:   "JC",
			expectedRiver:  "TS",
		},
		{
			name:           "Flop only",
			heroCards:      "Q♦J♣",
			board:          "Q♠J♥9♦",
			expectedHero:   "QD JC",
			expectedFlop:   "QS JH 9D",
			expectedTurn:   "",
			expectedRiver:  "",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Convert hero cards
			convertedHero := convertUnicodeSuitsToLetters(tt.heroCards)
			formattedHero := formatHoleCards(convertedHero)
			
			// Convert and parse board
			convertedBoard := convertUnicodeSuitsToLetters(tt.board)
			flop, turn, river := parseBoard(convertedBoard)
			
			if formattedHero != tt.expectedHero {
				t.Errorf("Hero cards = %q, want %q", formattedHero, tt.expectedHero)
			}
			if flop != tt.expectedFlop {
				t.Errorf("Flop = %q, want %q", flop, tt.expectedFlop)
			}
			if turn != tt.expectedTurn {
				t.Errorf("Turn = %q, want %q", turn, tt.expectedTurn)
			}
			if river != tt.expectedRiver {
				t.Errorf("River = %q, want %q", river, tt.expectedRiver)
			}
		})
	}
}

// Benchmark the conversion function to ensure it's performant
func BenchmarkConvertUnicodeSuitsToLetters(b *testing.B) {
	testCases := []string{
		"A♠K♥",
		"A♠K♥Q♦J♣T♠",
		"A♠ K♥ Q♦ J♣ T♠ 9♥ 8♦ 7♣ 6♠ 5♥",
		"",
		"AS KH",
	}
	
	for _, tc := range testCases {
		b.Run("input_"+strings.ReplaceAll(tc, " ", "_"), func(b *testing.B) {
			for i := 0; i < b.N; i++ {
				convertUnicodeSuitsToLetters(tc)
			}
		})
	}
}