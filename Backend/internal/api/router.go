package api

import (
	"log-analyzer/internal/api/handlers"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func SetupRouter(alertHandler *handlers.AlertHandler, ruleHandler *handlers.RuleHandler) *gin.Engine {
	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000", "http://127.0.0.1:3000"}, // React portu
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	api := r.Group("/api")
	{
		api.GET("/alerts", alertHandler.GetAlerts)
		api.GET("/stats", alertHandler.GetStats)

		api.GET("/rules", ruleHandler.GetRules)
		api.POST("/rules", ruleHandler.CreateRule)
		api.DELETE("/rules/:id", ruleHandler.DeleteRule)
	}

	return r
}
