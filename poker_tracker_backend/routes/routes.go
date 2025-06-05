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

	http.HandleFunc("/stats", handlers.GetStats)
} 