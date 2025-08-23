package routes

import (
	"encoding/json"
	"net/http"
	"poker_tracker_backend/handlers"
)

// CORS middleware
func enableCORS(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}
}

func RegisterRoutes() {
	http.HandleFunc("/sessions", func(w http.ResponseWriter, r *http.Request) {
		enableCORS(w, r)
		if r.Method == "OPTIONS" {
			return
		}
		switch r.Method {
		case http.MethodGet:
			handlers.GetSessions(w, r)
		case http.MethodPost:
			handlers.CreateSession(w, r)
		case http.MethodDelete:
			handlers.DeleteSession(w, r)
		}
	})

	http.HandleFunc("/session", func(w http.ResponseWriter, r *http.Request) {
		enableCORS(w, r)
		if r.Method == "OPTIONS" {
			return
		}
		switch r.Method {
		case http.MethodGet:
			handlers.GetSession(w, r)
		case http.MethodPut:
			handlers.UpdateSession(w, r)
		}
	})

	http.HandleFunc("/hands", func(w http.ResponseWriter, r *http.Request) {
		enableCORS(w, r)
		if r.Method == "OPTIONS" {
			return
		}
		switch r.Method {
		case http.MethodGet:
			handlers.GetHands(w, r)
		case http.MethodPost:
			handlers.CreateHand(w, r)
		case http.MethodDelete:
			handlers.DeleteHand(w, r)
		}
	})

	http.HandleFunc("/hand", func(w http.ResponseWriter, r *http.Request) {
		enableCORS(w, r)
		if r.Method == "OPTIONS" {
			return
		}
		switch r.Method {
		case http.MethodGet:
			handlers.GetHand(w, r)
		case http.MethodPut:
			handlers.UpdateHand(w, r)
		}
	})

	// 健康檢查路由
	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		enableCORS(w, r)
		if r.Method == "OPTIONS" {
			return
		}
		w.Header().Set("Content-Type", "application/json")
		response := map[string]interface{}{
			"status":  "healthy",
			"service": "poker-tracker-backend",
			"features": map[string]bool{
				"ai_analysis": true,
				"database":    false, // Will be updated based on actual DB status
			},
		}
		json.NewEncoder(w).Encode(response)
	})

	// 測試路由
	http.HandleFunc("/test", func(w http.ResponseWriter, r *http.Request) {
		enableCORS(w, r)
		if r.Method == "OPTIONS" {
			return
		}
		w.Write([]byte("Test route works"))
	})

	// 暫時註釋掉analyze路由
	http.HandleFunc("/analyze", func(w http.ResponseWriter, r *http.Request) {
		enableCORS(w, r)
		if r.Method == "OPTIONS" {
			return
		}
		handlers.AnalyzeHand(w, r)
	})

	// 切換最愛狀態
	http.HandleFunc("/toggle-favorite", func(w http.ResponseWriter, r *http.Request) {
		enableCORS(w, r)
		if r.Method == "OPTIONS" {
			return
		}
		handlers.ToggleFavorite(w, r)
	})

	// 獲取可用的 AI 模型
	http.HandleFunc("/models", func(w http.ResponseWriter, r *http.Request) {
		enableCORS(w, r)
		if r.Method == "OPTIONS" {
			return
		}
		handlers.GetAvailableModels(w, r)
	})

	http.HandleFunc("/stats", func(w http.ResponseWriter, r *http.Request) {
		enableCORS(w, r)
		if r.Method == "OPTIONS" {
			return
		}
		handlers.GetStats(w, r)
	})
}
