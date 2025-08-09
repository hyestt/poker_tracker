package models

import (
	"encoding/json"
	"testing"
)

func TestSessionJSON(t *testing.T) {
	session := Session{
		ID:            "test-id",
		Location:      "Test Casino",
		Date:          "2024-01-01",
		SmallBlind:    1,
		BigBlind:      2,
		Currency:      "USD",
		EffectiveStack: 200,
		TableSize:     9,
		Tag:           "tournament",
	}

	// Test JSON marshaling
	jsonData, err := json.Marshal(session)
	if err != nil {
		t.Fatalf("Failed to marshal session: %v", err)
	}

	// Test JSON unmarshaling
	var unmarshaledSession Session
	err = json.Unmarshal(jsonData, &unmarshaledSession)
	if err != nil {
		t.Fatalf("Failed to unmarshal session: %v", err)
	}

	// Verify data integrity
	if unmarshaledSession.ID != session.ID {
		t.Errorf("ID mismatch: got %v, want %v", unmarshaledSession.ID, session.ID)
	}
	if unmarshaledSession.Location != session.Location {
		t.Errorf("Location mismatch: got %v, want %v", unmarshaledSession.Location, session.Location)
	}
}

func TestHandJSON(t *testing.T) {
	holeCards := "AhKs"
	board := "AcKdQh"
	position := "BTN"
	note := "Test note"

	hand := Hand{
		ID:        "test-hand-id",
		SessionID: "test-session-id",
		HoleCards: &holeCards,
		Board:     &board,
		Position:  &position,
		Details:   "Pre-flop raise",
		Note:      &note,
		Result:    100,
		Date:      "2024-01-01",
		Tag:       "bluff",
		Villains: []Villain{
			{ID: "v1", HoleCards: "QsJs", Position: "UTG"},
		},
		Analysis:     "Good hand",
		AnalysisDate: "2024-01-01T10:00:00Z",
		Favorite:     true,
	}

	// Test JSON marshaling
	jsonData, err := json.Marshal(hand)
	if err != nil {
		t.Fatalf("Failed to marshal hand: %v", err)
	}

	// Test JSON unmarshaling
	var unmarshaledHand Hand
	err = json.Unmarshal(jsonData, &unmarshaledHand)
	if err != nil {
		t.Fatalf("Failed to unmarshal hand: %v", err)
	}

	// Verify data integrity
	if unmarshaledHand.ID != hand.ID {
		t.Errorf("ID mismatch: got %v, want %v", unmarshaledHand.ID, hand.ID)
	}
	if *unmarshaledHand.HoleCards != *hand.HoleCards {
		t.Errorf("HoleCards mismatch: got %v, want %v", *unmarshaledHand.HoleCards, *hand.HoleCards)
	}
	if len(unmarshaledHand.Villains) != len(hand.Villains) {
		t.Errorf("Villains length mismatch: got %v, want %v", len(unmarshaledHand.Villains), len(hand.Villains))
	}
}

func TestVillainJSON(t *testing.T) {
	villain := Villain{
		ID:        "villain-1",
		HoleCards: "QhQd",
		Position:  "UTG",
	}

	// Test JSON marshaling
	jsonData, err := json.Marshal(villain)
	if err != nil {
		t.Fatalf("Failed to marshal villain: %v", err)
	}

	// Test JSON unmarshaling
	var unmarshaledVillain Villain
	err = json.Unmarshal(jsonData, &unmarshaledVillain)
	if err != nil {
		t.Fatalf("Failed to unmarshal villain: %v", err)
	}

	// Verify data integrity
	if unmarshaledVillain.ID != villain.ID {
		t.Errorf("ID mismatch: got %v, want %v", unmarshaledVillain.ID, villain.ID)
	}
	if unmarshaledVillain.HoleCards != villain.HoleCards {
		t.Errorf("HoleCards mismatch: got %v, want %v", unmarshaledVillain.HoleCards, villain.HoleCards)
	}
	if unmarshaledVillain.Position != villain.Position {
		t.Errorf("Position mismatch: got %v, want %v", unmarshaledVillain.Position, villain.Position)
	}
}

func TestStatsJSON(t *testing.T) {
	stats := Stats{
		TotalProfit:   1000,
		TotalSessions: 10,
		WinRate:       70,
		AvgSession:    100.0,
		ByStakes: map[string]int{
			"1/2": 500,
			"2/5": 500,
		},
		ByLocation: map[string]int{
			"Casino A": 600,
			"Casino B": 400,
		},
	}

	// Test JSON marshaling
	jsonData, err := json.Marshal(stats)
	if err != nil {
		t.Fatalf("Failed to marshal stats: %v", err)
	}

	// Test JSON unmarshaling
	var unmarshaledStats Stats
	err = json.Unmarshal(jsonData, &unmarshaledStats)
	if err != nil {
		t.Fatalf("Failed to unmarshal stats: %v", err)
	}

	// Verify data integrity
	if unmarshaledStats.TotalProfit != stats.TotalProfit {
		t.Errorf("TotalProfit mismatch: got %v, want %v", unmarshaledStats.TotalProfit, stats.TotalProfit)
	}
	if unmarshaledStats.WinRate != stats.WinRate {
		t.Errorf("WinRate mismatch: got %v, want %v", unmarshaledStats.WinRate, stats.WinRate)
	}
}