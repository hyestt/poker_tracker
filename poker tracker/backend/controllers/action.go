package controllers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/username/poker-tracker/models"
	"gorm.io/gorm"
)

// 動作控制器結構
type ActionController struct {
	DB *gorm.DB
}

// 新建控制器實例
func NewActionController(db *gorm.DB) *ActionController {
	return &ActionController{DB: db}
}

// 獲取指定手牌ID的所有動作
func (c *ActionController) GetActionsByHandID(ctx *gin.Context) {
	handID := ctx.Param("handID")
	var actions []models.Action
	
	result := c.DB.Where("hand_id = ?", handID).Order("created_at").Find(&actions)
	if result.Error != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "獲取動作記錄失敗"})
		return
	}
	
	ctx.JSON(http.StatusOK, actions)
}

// 獲取單個動作
func (c *ActionController) GetAction(ctx *gin.Context) {
	id := ctx.Param("id")
	var action models.Action
	
	result := c.DB.First(&action, id)
	if result.Error != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "動作記錄不存在"})
		return
	}
	
	ctx.JSON(http.StatusOK, action)
}

// 創建動作
func (c *ActionController) CreateAction(ctx *gin.Context) {
	handID := ctx.Param("handID")
	var input models.Action
	
	if err := ctx.ShouldBindJSON(&input); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	// 設定手牌ID
	handIDUint, err := strconv.ParseUint(handID, 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "無效的手牌ID"})
		return
	}
	input.HandID = uint(handIDUint)
	
	// 創建記錄
	result := c.DB.Create(&input)
	if result.Error != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "創建動作記錄失敗"})
		return
	}
	
	ctx.JSON(http.StatusCreated, input)
}

// 更新動作
func (c *ActionController) UpdateAction(ctx *gin.Context) {
	id := ctx.Param("id")
	var action models.Action
	
	if err := c.DB.First(&action, id).Error; err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "動作記錄不存在"})
		return
	}
	
	var input models.Action
	if err := ctx.ShouldBindJSON(&input); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	// 更新記錄
	c.DB.Model(&action).Updates(input)
	ctx.JSON(http.StatusOK, action)
}

// 刪除動作
func (c *ActionController) DeleteAction(ctx *gin.Context) {
	id := ctx.Param("id")
	
	result := c.DB.Delete(&models.Action{}, id)
	if result.Error != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "刪除動作記錄失敗"})
		return
	}
	
	ctx.JSON(http.StatusOK, gin.H{"message": "動作記錄已刪除"})
} 