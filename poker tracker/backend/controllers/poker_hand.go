package controllers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/username/poker-tracker/models"
	"gorm.io/gorm"
)

// 控制器結構
type PokerHandController struct {
	DB *gorm.DB
}

// 新建控制器實例
func NewPokerHandController(db *gorm.DB) *PokerHandController {
	return &PokerHandController{DB: db}
}

// 獲取所有手牌記錄
func (c *PokerHandController) GetAllHands(ctx *gin.Context) {
	var hands []models.PokerHand
	result := c.DB.Order("created_at desc").Find(&hands)
	if result.Error != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "獲取手牌記錄失敗"})
		return
	}
	ctx.JSON(http.StatusOK, hands)
}

// 獲取單個手牌記錄
func (c *PokerHandController) GetHand(ctx *gin.Context) {
	id := ctx.Param("id")
	var hand models.PokerHand
	result := c.DB.Preload("Actions").First(&hand, id)
	if result.Error != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "手牌記錄不存在"})
		return
	}
	ctx.JSON(http.StatusOK, hand)
}

// 創建手牌記錄
func (c *PokerHandController) CreateHand(ctx *gin.Context) {
	var input models.PokerHand
	if err := ctx.ShouldBindJSON(&input); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 設定結果 = 取出金額 - 買入金額
	input.Result = input.CashOut - input.BuyIn

	// 創建記錄
	result := c.DB.Create(&input)
	if result.Error != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "創建手牌記錄失敗"})
		return
	}

	ctx.JSON(http.StatusCreated, input)
}

// 更新手牌記錄
func (c *PokerHandController) UpdateHand(ctx *gin.Context) {
	id := ctx.Param("id")
	var hand models.PokerHand
	if err := c.DB.First(&hand, id).Error; err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "手牌記錄不存在"})
		return
	}

	var input models.PokerHand
	if err := ctx.ShouldBindJSON(&input); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 更新結果 = 取出金額 - 買入金額
	input.Result = input.CashOut - input.BuyIn

	// 更新記錄
	c.DB.Model(&hand).Updates(input)
	ctx.JSON(http.StatusOK, hand)
}

// 刪除手牌記錄
func (c *PokerHandController) DeleteHand(ctx *gin.Context) {
	id := ctx.Param("id")
	result := c.DB.Delete(&models.PokerHand{}, id)
	if result.Error != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "刪除手牌記錄失敗"})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"message": "手牌記錄已刪除"})
}

// 獲取統計資料
func (c *PokerHandController) GetStats(ctx *gin.Context) {
	var hands []models.PokerHand
	result := c.DB.Find(&hands)
	if result.Error != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "獲取統計資料失敗"})
		return
	}

	// 計算統計資料
	totalProfit := 0.0
	winCount := 0
	totalHands := len(hands)

	for _, hand := range hands {
		totalProfit += hand.Result
		if hand.Result > 0 {
			winCount++
		}
	}

	avgProfit := 0.0
	winRate := 0.0
	if totalHands > 0 {
		avgProfit = totalProfit / float64(totalHands)
		winRate = float64(winCount) / float64(totalHands) * 100
	}

	stats := models.Statistic{
		TotalHands:  totalHands,
		TotalProfit: totalProfit,
		AvgProfit:   avgProfit,
		WinRate:     winRate,
	}

	ctx.JSON(http.StatusOK, stats)
} 