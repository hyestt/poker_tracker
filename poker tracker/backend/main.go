package main

import (
	"log"

	"github.com/username/poker-tracker/models"
	"github.com/username/poker-tracker/routes"
)

func main() {
	// 設置資料庫連接
	db := models.SetupDB()

	// 設置路由
	r := routes.SetupRouter(db)

	// 啟動服務器
	log.Println("伺服器已啟動，端口 8080...")
	if err := r.Run(":8080"); err != nil {
		log.Fatalf("啟動伺服器失敗: %v", err)
	}
} 