package routes

import (
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/username/poker-tracker/controllers"
	"gorm.io/gorm"
)

// 設置路由
func SetupRouter(db *gorm.DB) *gin.Engine {
	r := gin.Default()

	// 配置 CORS
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	// 初始化控制器
	pokerHandController := controllers.NewPokerHandController(db)
	actionController := controllers.NewActionController(db)

	// API路由組
	api := r.Group("/api")
	{
		// 手牌相關路由
		hands := api.Group("/hands")
		{
			hands.GET("", pokerHandController.GetAllHands)
			hands.POST("", pokerHandController.CreateHand)
			hands.GET("/:id", pokerHandController.GetHand)
			hands.PUT("/:id", pokerHandController.UpdateHand)
			hands.DELETE("/:id", pokerHandController.DeleteHand)

			// 動作相關路由
			hands.GET("/:handID/actions", actionController.GetActionsByHandID)
			hands.POST("/:handID/actions", actionController.CreateAction)
		}

		// 單獨的動作路由
		actions := api.Group("/actions")
		{
			actions.GET("/:id", actionController.GetAction)
			actions.PUT("/:id", actionController.UpdateAction)
			actions.DELETE("/:id", actionController.DeleteAction)
		}

		// 統計資料路由
		api.GET("/stats", pokerHandController.GetStats)
	}

	return r
} 