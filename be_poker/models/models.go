package models

type Session struct {
	ID            string `json:"id"`
	Location      string `json:"location"`
	Date          string `json:"date"`
	SmallBlind    int    `json:"smallBlind"`
	BigBlind      int    `json:"bigBlind"`
	Currency      string `json:"currency"`
	EffectiveStack int   `json:"effectiveStack"`
	TableSize     int    `json:"tableSize"`
}

type Hand struct {
	ID           string  `json:"id"`
	SessionID    string  `json:"sessionId"`
	HoleCards    *string `json:"holeCards"`    // 手牌 - 使用指針處理 null
	Position     *string `json:"position"`     // 位置 - 使用指針處理 null
	Details      string  `json:"details"`
	Result       int     `json:"result"`
	Date         string  `json:"date"`
	Analysis     string  `json:"analysis,omitempty"`     // OpenAI 分析結果
	AnalysisDate string  `json:"analysisDate,omitempty"` // 分析時間
	Favorite     bool    `json:"favorite"`     // 是否為最愛
}

type Stats struct {
	TotalProfit    int               `json:"totalProfit"`
	TotalSessions  int               `json:"totalSessions"`
	WinRate        int               `json:"winRate"`
	AvgSession     float64           `json:"avgSession"`
	ByStakes       map[string]int    `json:"byStakes"`
	ByLocation     map[string]int    `json:"byLocation"`
} 