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
	Tag           string `json:"tag"`
}

type Villain struct {
	ID        string `json:"id"`
	HoleCards string `json:"holeCards"`
	Position  string `json:"position"`
}

type Hand struct {
	ID           string    `json:"id"`
	SessionID    string    `json:"sessionId"`
	HoleCards    *string   `json:"holeCards"`    // 手牌 - 使用指針處理 null
	Board        *string   `json:"board"`        // 公共牌
	Position     *string   `json:"position"`     // 位置 - 使用指針處理 null
	Details      string    `json:"details"`
	Note         *string   `json:"note"`         // 筆記
	Result       int       `json:"result"`
	Date         string    `json:"date"`
	Tag          string    `json:"tag"`          // 標籤
	Villains     []Villain `json:"villains"`     // Villains 陣列
	Analysis     string    `json:"analysis,omitempty"`     // OpenAI 分析結果
	AnalysisDate string    `json:"analysisDate,omitempty"` // 分析時間
	Favorite     bool      `json:"favorite"`     // 是否為最愛
}

type Stats struct {
	TotalProfit    int               `json:"totalProfit"`
	TotalSessions  int               `json:"totalSessions"`
	WinRate        int               `json:"winRate"`
	AvgSession     float64           `json:"avgSession"`
	ByStakes       map[string]int    `json:"byStakes"`
	ByLocation     map[string]int    `json:"byLocation"`
} 