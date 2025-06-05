package main

import (
	"log"
	"net/http"
	"poker_tracker_backend/db"
	"poker_tracker_backend/routes"
)

func main() {
	db.InitDB("poker_tracker.db")
	routes.RegisterRoutes()
	log.Println("Server started at :8080")
	http.ListenAndServe(":8080", nil)
} 