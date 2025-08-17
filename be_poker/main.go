package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"os/exec"
	"poker_tracker_backend/db"
	"poker_tracker_backend/routes"
	"strings"
	"time"
)

func checkEnvironment() {
	fmt.Println("🎯 Poker Tracker Backend Starting...")
	fmt.Println("====================================")
	fmt.Println()

	// 檢查 OpenAI API Key
	apiKey := os.Getenv("OPENAI_API_KEY")
	if apiKey == "" {
		fmt.Println("⚠️  OpenAI API Key not found!")
		fmt.Println()
		fmt.Println("📝 To set up your API key:")
		fmt.Println("1. Get your API key from https://platform.openai.com")
		fmt.Println("2. Add to your shell profile:")
		fmt.Println("   echo 'export OPENAI_API_KEY=\"your-api-key\"' >> ~/.bash_profile")
		fmt.Println("   source ~/.bash_profile")
		fmt.Println()
		fmt.Println("3. Or set it temporarily:")
		fmt.Println("   OPENAI_API_KEY=\"your-api-key\" go run main.go")
		fmt.Println()
		fmt.Println("🚀 Server will start without AI analysis features")
		fmt.Println()
	} else {
		keyPreview := apiKey
		if len(apiKey) > 10 {
			keyPreview = apiKey[:10] + "..."
		}
		fmt.Printf("✅ OpenAI API Key loaded: %s\n", keyPreview)
		fmt.Println("🤖 AI analysis features enabled!")
		fmt.Println()
	}

	// 檢查端口是否被佔用
	fmt.Println("🔍 Checking port 8080...")
	if isPortInUse(8080) {
		fmt.Println("⚠️  Port 8080 is already in use!")
		fmt.Println("🛑 Attempting to stop existing server...")
		stopExistingServer()
		time.Sleep(2 * time.Second)
	}
	fmt.Println("✅ Port 8080 is available")
	fmt.Println()
}

func isPortInUse(port int) bool {
	cmd := exec.Command("lsof", "-ti", fmt.Sprintf(":%d", port))
	output, err := cmd.Output()
	return err == nil && len(strings.TrimSpace(string(output))) > 0
}

func stopExistingServer() {
	// 停止 go run main.go 進程
	cmd := exec.Command("pkill", "-f", "go run main.go")
	cmd.Run()

	// 也停止任何佔用 8080 端口的進程
	cmd2 := exec.Command("sh", "-c", "lsof -ti:8080 | xargs kill -9 2>/dev/null")
	cmd2.Run()
}

func printStartupInfo() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	fmt.Println("🚀 Server Configuration:")
	fmt.Printf("   📍 Port: %s\n", port)
	fmt.Println("   🗄️  Database: SQLite (Local)")
	fmt.Println("   📁 Database File: poker_tracker.db")

	// 只在本地開發時顯示本地地址
	if port == "8080" {
		fmt.Println("   📍 Local: http://localhost:8080")
		fmt.Println("   📍 Network: http://192.168.1.28:8080")
	}
	fmt.Println()

	fmt.Println("📱 API Endpoints:")
	fmt.Println("   GET  /hands     - List hands")
	fmt.Println("   POST /hands     - Create hand")
	fmt.Println("   POST /analyze   - AI analysis")
	fmt.Println("   GET  /sessions  - List sessions")
	fmt.Println("   GET  /stats     - Statistics")
	fmt.Println()

	fmt.Println("💡 Frontend Connection:")
	fmt.Println("   Make sure your React Native app points to:")
	fmt.Println("   http://192.168.1.28:8080")
	fmt.Println()

	fmt.Println("💰 Cost Info:")
	fmt.Println("   AI Analysis: ~$0.0003-0.0008 per request")
	fmt.Println("   Model: GPT-4o")
	fmt.Println()

	fmt.Println("🎉 Server ready! Happy poker tracking! 🃏")
	fmt.Println("=====================================")
}

func main() {
	// 環境檢查
	checkEnvironment()

	// 初始化資料庫（可選）
	fmt.Println("🗄️  Initializing database connection...")
	if err := db.InitDB(); err != nil {
		fmt.Printf("⚠️  Database initialization failed: %v\n", err)
		fmt.Println("🚀 Continuing in API-only mode (AI analysis still available)")
	} else {
		fmt.Println("✅ Database ready")
	}
	fmt.Println()

	// 註冊路由
	fmt.Println("🛣️  Registering routes...")
	routes.RegisterRoutes()
	fmt.Println("✅ Routes registered")
	fmt.Println()

	// 顯示啟動信息
	printStartupInfo()

	// 啟動服務器
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	fmt.Printf("🔄 Starting HTTP server on port %s...\n", port)
	fmt.Println()

	// 使用 log.Fatal 來捕獲啟動錯誤
	if err := http.ListenAndServe(":"+port, nil); err != nil {
		log.Fatalf("❌ Server failed to start: %v", err)
	}
}
