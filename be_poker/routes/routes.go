package routes

import (
	"net/http"
	"poker_tracker/handlers"
	"github.com/gorilla/mux"
	"github.com/rs/cors"
)

func SetupRoutes() http.Handler {
	// 創建新的路由器
	r := mux.NewRouter()

	// API路由
	api := r.PathPrefix("/").Subrouter()

	// Sessions路由
	api.HandleFunc("/sessions", handlers.GetSessions).Methods("GET")
	api.HandleFunc("/sessions", handlers.CreateSession).Methods("POST")
	api.HandleFunc("/sessions", handlers.DeleteSession).Methods("DELETE")
	
	// Session路由
	api.HandleFunc("/session", handlers.GetSession).Methods("GET")
	api.HandleFunc("/session", handlers.UpdateSession).Methods("PUT")

	// Hands路由
	api.HandleFunc("/hands", handlers.GetHands).Methods("GET")
	api.HandleFunc("/hands", handlers.CreateHand).Methods("POST")
	api.HandleFunc("/hands", handlers.DeleteHand).Methods("DELETE")
	
	// Hand路由
	api.HandleFunc("/hand", handlers.GetHand).Methods("GET")
	api.HandleFunc("/hand", handlers.UpdateHand).Methods("PUT")

	// AI分析路由
	api.HandleFunc("/analyze", handlers.AnalyzeHand).Methods("POST")

	// 切換最愛狀態
	api.HandleFunc("/toggle-favorite", handlers.ToggleFavorite).Methods("POST")

	// 統計路由
	api.HandleFunc("/stats", handlers.GetStats).Methods("GET")

	// 測試路由
	api.HandleFunc("/test", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("Test route works"))
	}).Methods("GET")

	// 設置CORS
	c := cors.New(cors.Options{
		AllowedOrigins: []string{"*"},
		AllowedMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders: []string{"*"},
		AllowCredentials: true,
	})

	return c.Handler(r)
} 