package models

type Session struct {
	ID            string `json:"id"`
	Location      string `json:"location"`
	Date          string `json:"date"`
	SmallBlind    int    `json:"smallBlind"`
	BigBlind      int    `json:"bigBlind"`
	Currency      string `json:"currency"`
	EffectiveStack int   `json:"effectiveStack"`
}

type Hand struct {
	ID        string `json:"id"`
	SessionID string `json:"sessionId"`
	Details   string `json:"details"`
	Result    int    `json:"result"`
	Date      string `json:"date"`
}

type Stats struct {
	TotalProfit    int               `json:"totalProfit"`
	TotalSessions  int               `json:"totalSessions"`
	WinRate        int               `json:"winRate"`
	AvgSession     float64           `json:"avgSession"`
	ByStakes       map[string]int    `json:"byStakes"`
	ByLocation     map[string]int    `json:"byLocation"`
} 