package routes

import (
	"net/http"
	"poker_tracker_backend/handlers"
)

func RegisterRoutes() {
	http.HandleFunc("/sessions", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			handlers.GetSessions(w, r)
		case http.MethodPost:
			handlers.CreateSession(w, r)
		case http.MethodDelete:
			handlers.DeleteSession(w, r)
		}
	})

	http.HandleFunc("/session", handlers.GetSession)

	http.HandleFunc("/hands", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			handlers.GetHands(w, r)
		case http.MethodPost:
			handlers.CreateHand(w, r)
		case http.MethodDelete:
			handlers.DeleteHand(w, r)
		}
	})

	http.HandleFunc("/hand", handlers.GetHand)

	// 測試路由
	http.HandleFunc("/test", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("Test route works"))
	})

	// 暫時註釋掉analyze路由
	http.HandleFunc("/analyze", handlers.AnalyzeHand)

	http.HandleFunc("/stats", handlers.GetStats)
} 