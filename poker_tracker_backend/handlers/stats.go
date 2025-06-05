package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"poker_tracker_backend/db"
	"poker_tracker_backend/models"
)

func GetStats(w http.ResponseWriter, r *http.Request) {
	handsRows, _ := db.DB.Query(`SELECT result, session_id FROM hands`)
	sessionsRows, _ := db.DB.Query(`SELECT id, location, small_blind, big_blind FROM sessions`)

	totalProfit := 0
	sessionProfits := map[string]int{}
	byStakes := map[string]int{}
	byLocation := map[string]int{}
	sessionCount := 0
	winSessions := 0

	for handsRows.Next() {
		var result int
		var sessionId string
		handsRows.Scan(&result, &sessionId)
		totalProfit += result
		if _, ok := sessionProfits[sessionId]; !ok {
			sessionProfits[sessionId] = 0
		}
		sessionProfits[sessionId] += result
	}

	for sessionsRows.Next() {
		var id, location string
		var sb, bb int
		sessionsRows.Scan(&id, &location, &sb, &bb)
		sessionCount++
		profit := sessionProfits[id]
		if profit > 0 {
			winSessions++
		}
		stakeKey := "$" + itoa(sb) + "/" + itoa(bb)
		byStakes[stakeKey] += profit
		byLocation[location] += profit
	}

	avgSession := 0.0
	if sessionCount > 0 {
		avgSession = float64(totalProfit) / float64(sessionCount)
	}
	winRate := 0
	if sessionCount > 0 {
		winRate = int(float64(winSessions) / float64(sessionCount) * 100)
	}

	stats := models.Stats{
		TotalProfit:    totalProfit,
		TotalSessions:  sessionCount,
		WinRate:        winRate,
		AvgSession:     avgSession,
		ByStakes:       byStakes,
		ByLocation:     byLocation,
	}
	json.NewEncoder(w).Encode(stats)
}

func itoa(i int) string {
	return fmt.Sprintf("%d", i)
} 