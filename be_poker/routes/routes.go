package routes

import (
	"encoding/json"
	"net/http"
	"poker_tracker_backend/handlers"
	"poker_tracker_backend/metrics"
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
	http.Handle("/metrics", metrics.Handler)

	http.HandleFunc("/sessions", metrics.WithMetrics("/sessions", func(w http.ResponseWriter, r *http.Request) {
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
	}))

	http.HandleFunc("/session", metrics.WithMetrics("/session", func(w http.ResponseWriter, r *http.Request) {
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
	}))

	http.HandleFunc("/hands", metrics.WithMetrics("/hands", func(w http.ResponseWriter, r *http.Request) {
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
	}))

	http.HandleFunc("/hand", metrics.WithMetrics("/hand", func(w http.ResponseWriter, r *http.Request) {
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
	}))

	// 健康檢查路由
	http.HandleFunc("/health", metrics.WithMetrics("/health", func(w http.ResponseWriter, r *http.Request) {
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
	}))

	// 測試路由
	http.HandleFunc("/test", metrics.WithMetrics("/test", func(w http.ResponseWriter, r *http.Request) {
		enableCORS(w, r)
		if r.Method == "OPTIONS" {
			return
		}
		w.Write([]byte("Test route works"))
	}))

	// Debug: call GPT-5-mini via backend (Responses API)
	http.HandleFunc("/debug/gpt5mini", metrics.WithMetrics("/debug/gpt5mini", func(w http.ResponseWriter, r *http.Request) {
		enableCORS(w, r)
		if r.Method == "OPTIONS" {
			return
		}
		handlers.DebugGpt5Mini(w, r)
	}))

	// 暫時註釋掉analyze路由
	http.HandleFunc("/analyze", metrics.WithMetrics("/analyze", func(w http.ResponseWriter, r *http.Request) {
		enableCORS(w, r)
		if r.Method == "OPTIONS" {
			return
		}
		handlers.AnalyzeHand(w, r)
	}))

	// 切換最愛狀態
	http.HandleFunc("/toggle-favorite", metrics.WithMetrics("/toggle-favorite", func(w http.ResponseWriter, r *http.Request) {
		enableCORS(w, r)
		if r.Method == "OPTIONS" {
			return
		}
		handlers.ToggleFavorite(w, r)
	}))

	// 獲取可用的 AI 模型
	http.HandleFunc("/models", metrics.WithMetrics("/models", func(w http.ResponseWriter, r *http.Request) {
		enableCORS(w, r)
		if r.Method == "OPTIONS" {
			return
		}
		handlers.GetAvailableModels(w, r)
	}))

	http.HandleFunc("/stats", metrics.WithMetrics("/stats", func(w http.ResponseWriter, r *http.Request) {
		enableCORS(w, r)
		if r.Method == "OPTIONS" {
			return
		}
		handlers.GetStats(w, r)
	}))
}
