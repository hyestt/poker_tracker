package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"poker_tracker/db"
	"poker_tracker/models"
)

func GetStats(w http.ResponseWriter, r *http.Request) {
	handsRows, err := db.DB.Query(`SELECT COALESCE(result_amount, 0), COALESCE(session_id, '') FROM hands`)
	if err != nil {
		http.Error(w, "Error querying hands: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer handsRows.Close()
	
	sessionsRows, err := db.DB.Query(`SELECT id, COALESCE(location, ''), COALESCE(small_blind, 0), COALESCE(big_blind, 0) FROM sessions`)
	if err != nil {
		http.Error(w, "Error querying sessions: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer sessionsRows.Close()

	totalProfit := 0
	sessionProfits := map[string]int{}
	byStakes := map[string]int{}
	byLocation := map[string]int{}
	sessionCount := 0
	winSessions := 0

	for handsRows.Next() {
		var result int
		var sessionId string
		err := handsRows.Scan(&result, &sessionId)
		if err != nil {
			continue
		}
		totalProfit += result
		if _, ok := sessionProfits[sessionId]; !ok {
			sessionProfits[sessionId] = 0
		}
		sessionProfits[sessionId] += result
	}

	for sessionsRows.Next() {
		var id, location string
		var sb, bb int
		err := sessionsRows.Scan(&id, &location, &sb, &bb)
		if err != nil {
			continue
		}
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
	
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Content-Type", "application/json")
	
	json.NewEncoder(w).Encode(stats)
}

func itoa(i int) string {
	return fmt.Sprintf("%d", i)
} 