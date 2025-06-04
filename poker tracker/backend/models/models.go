package models

import (
	"time"

	"gorm.io/gorm"
)

// 撲克遊戲場次
type PokerHand struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	Location  string    `json:"location"`
	BuyIn     float64   `json:"buyIn"`
	CashOut   float64   `json:"cashOut"`
	Result    float64   `json:"result"`
	StartTime time.Time `json:"startTime"`
	EndTime   time.Time `json:"endTime"`
	Notes     string    `json:"notes"`
	Actions   []Action  `json:"actions" gorm:"foreignKey:HandID"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// 牌局中的動作記錄
type Action struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	HandID    uint      `json:"handId"`
	Stage     string    `json:"stage"` // preflop, flop, turn, river
	ActionType string   `json:"actionType"` // bet, call, fold, check, raise, all-in
	Amount    float64   `json:"amount"`
	Position  string    `json:"position"` // UTG, MP, CO, BTN, SB, BB 等
	Cards     string    `json:"cards"`    // 玩家手牌，例如 "AhKs"
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// 統計資料模型
type Statistic struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	TotalHands int      `json:"totalHands"`
	TotalProfit float64 `json:"totalProfit"`
	AvgProfit  float64  `json:"avgProfit"`
	WinRate    float64  `json:"winRate"` // 勝率百分比
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// 數據庫初始化
func SetupModels(db *gorm.DB) {
	db.AutoMigrate(&PokerHand{}, &Action{}, &Statistic{})
} 